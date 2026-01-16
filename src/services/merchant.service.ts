// Merchant Service - Business logic for Merchant management
// Handles merchant operations including Stripe Connect account management
// Priority 4: Stripe Connect Integration

import { Merchant } from '../database/models/index.js';
import { StripeAccountStatus } from '../database/models/Merchant.js';
import paymentService from './payment.service.js';

interface CreateMerchantData {
  name: string;
  email: string;
  stripeAccountId?: string;
}

interface UpdateMerchantData extends Partial<CreateMerchantData> {
  isActive?: boolean;
}

// Stripe Connect onboarding result
interface StripeOnboardingResult {
  merchantId: string;
  stripeAccountId: string;
  onboardingUrl: string;
}

class MerchantService {
  // ==========================================
  // BASIC MERCHANT CRUD
  // ==========================================

  // Create new merchant
  async createMerchant(data: CreateMerchantData) {
    try {
      const merchant = await Merchant.create(data);
      return merchant;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Merchant email "${data.email}" already exists`);
      }
      throw error;
    }
  }

  // Get all merchants
  async getAllMerchants(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return await Merchant.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  // Get merchant by ID
  async getMerchantById(id: string) {
    const merchant = await Merchant.findByPk(id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    return merchant;
  }

  // Update merchant
  async updateMerchant(id: string, data: UpdateMerchantData) {
    const merchant = await this.getMerchantById(id);
    await merchant.update(data);
    return merchant;
  }

  // Deactivate merchant (soft delete)
  async deleteMerchant(id: string) {
    const merchant = await this.getMerchantById(id);
    await merchant.update({ isActive: false });
    return merchant;
  }

  // ==========================================
  // STRIPE CONNECT MANAGEMENT
  // ==========================================

  /**
   * Start Stripe Connect onboarding for a merchant
   * Creates a Stripe Express account and returns the onboarding URL
   *
   * Flow:
   * 1. Admin creates merchant record
   * 2. Admin initiates Stripe Connect onboarding
   * 3. Merchant receives onboarding URL
   * 4. Merchant completes Stripe verification
   * 5. Webhook updates merchant status
   */
  async startStripeOnboarding(merchantId: string): Promise<StripeOnboardingResult> {
    const merchant = await this.getMerchantById(merchantId);

    // Check if merchant already has Stripe account
    if (merchant.stripeAccountId) {
      // If account exists but onboarding incomplete, generate new link
      if (!merchant.stripeOnboardingComplete) {
        const onboardingUrl = await paymentService.createOnboardingLink(
          merchant.stripeAccountId,
          merchantId
        );
        return {
          merchantId,
          stripeAccountId: merchant.stripeAccountId,
          onboardingUrl,
        };
      }
      throw new Error('Merchant already has an active Stripe Connect account');
    }

    // Create new Stripe Connect account
    const result = await paymentService.createConnectAccount(
      merchantId,
      merchant.email,
      merchant.name
    );

    // Update merchant with Stripe account ID
    await merchant.update({
      stripeAccountId: result.accountId,
      stripeAccountStatus: 'pending',
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeOnboardingComplete: false,
    });

    return {
      merchantId,
      stripeAccountId: result.accountId,
      onboardingUrl: result.onboardingUrl,
    };
  }

  /**
   * Generate a new onboarding link for an existing Stripe account
   * Used when the previous link expired or merchant needs to continue onboarding
   */
  async refreshOnboardingLink(merchantId: string): Promise<string> {
    const merchant = await this.getMerchantById(merchantId);

    if (!merchant.stripeAccountId) {
      throw new Error('Merchant does not have a Stripe Connect account. Start onboarding first.');
    }

    return await paymentService.createOnboardingLink(
      merchant.stripeAccountId,
      merchantId
    );
  }

  /**
   * Get Stripe Express Dashboard login link for merchant
   * Allows merchant to view their payouts, transactions, etc.
   */
  async getStripeDashboardLink(merchantId: string): Promise<string> {
    const merchant = await this.getMerchantById(merchantId);

    if (!merchant.stripeAccountId) {
      throw new Error('Merchant does not have a Stripe Connect account');
    }

    if (!merchant.stripeOnboardingComplete) {
      throw new Error('Merchant has not completed Stripe onboarding');
    }

    return await paymentService.createDashboardLink(merchant.stripeAccountId);
  }

  /**
   * Sync merchant's Stripe status with Stripe API
   * Called after onboarding completion or manually to refresh status
   */
  async syncStripeStatus(merchantId: string) {
    const merchant = await this.getMerchantById(merchantId);

    if (!merchant.stripeAccountId) {
      throw new Error('Merchant does not have a Stripe Connect account');
    }

    const status = await paymentService.getAccountStatus(merchant.stripeAccountId);

    await merchant.update({
      stripeAccountStatus: status.status,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeOnboardingComplete: status.detailsSubmitted,
    });

    return {
      merchantId,
      stripeAccountId: merchant.stripeAccountId,
      status: status.status,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      onboardingComplete: status.detailsSubmitted,
      canReceivePayments: merchant.canReceivePayments(),
    };
  }

  /**
   * Disconnect merchant from Stripe Connect
   * Removes the Stripe account association (does not delete Stripe account)
   */
  async disconnectStripe(merchantId: string) {
    const merchant = await this.getMerchantById(merchantId);

    if (!merchant.stripeAccountId) {
      throw new Error('Merchant does not have a Stripe Connect account');
    }

    // Optionally delete the Stripe account (uncomment if needed)
    // await paymentService.deleteConnectAccount(merchant.stripeAccountId);

    // Clear Stripe connection from merchant record
    await merchant.update({
      stripeAccountId: undefined,
      stripeAccountStatus: undefined,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeOnboardingComplete: false,
    });

    return { success: true, message: 'Stripe account disconnected' };
  }

  /**
   * Get all merchants with their Stripe Connect status
   * For admin dashboard overview
   */
  async getMerchantsWithStripeStatus(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const merchants = await Merchant.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return merchants.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      isActive: m.isActive,
      stripeAccountId: m.stripeAccountId,
      stripeStatus: m.stripeAccountStatus,
      chargesEnabled: m.stripeChargesEnabled,
      payoutsEnabled: m.stripePayoutsEnabled,
      onboardingComplete: m.stripeOnboardingComplete,
      canReceivePayments: m.canReceivePayments(),
    }));
  }

  /**
   * Manually set Stripe account ID for a merchant
   * Used when merchant has existing Stripe account (admin only)
   */
  async setStripeAccountId(merchantId: string, stripeAccountId: string) {
    const merchant = await this.getMerchantById(merchantId);

    // Verify the account exists and get its status
    const status = await paymentService.getAccountStatus(stripeAccountId);

    await merchant.update({
      stripeAccountId,
      stripeAccountStatus: status.status,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeOnboardingComplete: status.detailsSubmitted,
    });

    return merchant;
  }
}

export default new MerchantService();
