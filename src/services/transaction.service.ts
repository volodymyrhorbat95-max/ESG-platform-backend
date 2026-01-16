// Transaction Service - Business logic for transaction processing
// Handles ALL 4 SKU types: CLAIM, PAY, GIFT_CARD, ALLOCATION
// CRITICAL: Impact calculated dynamically using CURRENT_CSR_PRICE from GlobalConfig
// UNIVERSAL FORMULA (all modes): impactGrams = (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000
// Per client clarification (conversation.txt line 682): "€1 generates 9,090 grams of removal. 1/0.11"

import { Op } from 'sequelize';
import { Transaction, SKU, User, GiftCardCode } from '../database/models/index.js';
import { PaymentMode } from '../database/models/SKU.js';
import { PaymentStatus } from '../database/models/Transaction.js';
import userService from './user.service.js';
import walletService from './wallet.service.js';
import giftCardService from './giftCard.service.js';
import skuService from './sku.service.js';
import configService from './config.service.js';
import emailService from './email.service.js';
import { env } from '../config/env.js';

// Registration data from frontend
interface RegistrationData {
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
  termsAccepted: boolean;
}

// Transaction creation input from frontend
interface CreateTransactionInput {
  skuCode: string;
  userId?: string;
  merchantId?: string;
  partnerId?: string;
  orderId?: string;
  amount?: number; // Required for ALLOCATION type (from URL)
  giftCardCode?: string; // Required for GIFT_CARD type
  registrationData?: RegistrationData;
}

class TransactionService {
  /**
   * Calculate impact in grams - UNIVERSAL FORMULA for ALL payment modes
   * Formula: (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000
   *
   * IMPORTANT: Client clarified (conversation.txt line 682):
   * "€1 generates 9,090 grams of removal. 1/0.11"
   * This means ALL modes (CLAIM, PAY, GIFT_CARD, ALLOCATION) use the SAME formula.
   *
   * Examples (with CSR_PRICE = €0.11/kg, multiplier = 1):
   * - €25 gift card: (25 / 0.11) * 1 * 1000 = 227,272 grams (227.27 kg)
   * - €10 gift card: (10 / 0.11) * 1 * 1000 = 90,909 grams (90.91 kg)
   * - €5 allocation: (5 / 0.11) * 1 * 1000 = 45,454 grams (45.45 kg)
   * - €15 allocation: (15 / 0.11) * 1 * 1000 = 136,363 grams (136.36 kg)
   * - €2.50 pasta: (2.50 / 0.11) * 1 * 1000 = 22,727 grams (22.73 kg)
   */
  calculateImpactGrams(amount: number, currentCSRPrice: number, impactMultiplier: number = 1.0): number {
    const impactKg = (amount / currentCSRPrice) * impactMultiplier;
    return Math.round(impactKg * 1000);
  }

  /**
   * Determine registration level required based on amount and threshold
   */
  determineRegistrationLevel(amount: number, corsairThreshold: number): 'minimal' | 'standard' | 'full' {
    if (amount >= corsairThreshold) {
      return 'full'; // Full registration for 10+ euro transactions
    }
    if (amount > 0) {
      return 'standard'; // Standard for paid transactions under threshold
    }
    return 'minimal'; // Minimal for free/CLAIM transactions
  }

  /**
   * Main transaction creation - handles all 4 SKU types
   * Flow: Validate SKU → Create/Find User → Calculate Impact → Create Transaction → Update Wallet
   */
  async createTransaction(input: CreateTransactionInput) {
    // 1. Get SKU information
    const sku = await skuService.getSKUByCode(input.skuCode);
    if (!sku.isActive) {
      throw new Error('This SKU is no longer active');
    }

    // 2. Get global config values (CSR price, Master ID, threshold)
    // Note: ALLOCATION_MULTIPLIER is no longer used - all modes use same formula
    const currentCSRPrice = await configService.getCurrentCSRPrice();
    const masterId = await configService.getMasterId();
    const corsairThreshold = await configService.getCorsairThreshold();

    // 3. Determine transaction amount based on SKU type
    let transactionAmount = 0;
    let paymentStatus: PaymentStatus = PaymentStatus.NA;
    let giftCardCodeId: string | undefined;

    switch (sku.paymentMode) {
      case PaymentMode.CLAIM:
        // Type 1: Prepaid Lot - Merchant already paid
        // Use SKU price for impact calculation
        transactionAmount = Number(sku.price);
        paymentStatus = PaymentStatus.NA;
        break;

      case PaymentMode.PAY:
        // Type 2: Pay-as-you-go - Customer pays via Stripe
        transactionAmount = Number(sku.price);
        paymentStatus = PaymentStatus.PENDING; // Needs Stripe payment
        break;

      case PaymentMode.GIFT_CARD:
        // Type 3: Gift Card - Customer paid at physical store
        if (!input.giftCardCode) {
          throw new Error('Gift card code is required');
        }
        transactionAmount = Number(sku.price);
        paymentStatus = PaymentStatus.COMPLETED; // Already paid at store
        break;

      case PaymentMode.ALLOCATION:
        // Type 4: Environmental Allocation - Amount from partner checkout URL
        if (!input.amount || input.amount <= 0) {
          throw new Error('Amount is required for allocation type');
        }
        transactionAmount = input.amount;
        paymentStatus = PaymentStatus.COMPLETED; // Paid at partner checkout
        break;

      default:
        throw new Error(`Unknown payment mode: ${sku.paymentMode}`);
    }

    // 4. Calculate impact in grams - UNIVERSAL FORMULA for ALL payment modes
    // Per client clarification: ALL modes use (amount / CSR_PRICE) * multiplier * 1000
    // Example: €5 / 0.11 × 1 = 45.45 kg = 45,454 grams
    const calculatedImpact = this.calculateImpactGrams(
      transactionAmount,
      currentCSRPrice,
      Number(sku.impactMultiplier)
    );

    // 5. Check if should flag for Corsair Connect (CORSAIR_THRESHOLD from global config)
    const corsairConnectFlag = transactionAmount >= corsairThreshold;

    // 6. Determine required registration level (using global CORSAIR_THRESHOLD)
    const requiredLevel = this.determineRegistrationLevel(
      transactionAmount,
      corsairThreshold
    );

    // 7. Create or find user based on registration level
    let user: User;

    if (input.userId) {
      // User already registered - just fetch
      user = await userService.getUserById(input.userId);
    } else if (input.registrationData) {
      // New user registration
      const regData = input.registrationData;

      switch (requiredLevel) {
        case 'minimal':
          user = await userService.findOrCreateMinimalUser({ email: regData.email });
          break;

        case 'standard':
          if (!regData.firstName || !regData.lastName) {
            throw new Error('First name and last name are required');
          }
          user = await userService.findOrCreateStandardUser({
            email: regData.email,
            firstName: regData.firstName,
            lastName: regData.lastName,
            termsAccepted: regData.termsAccepted,
          });
          break;

        case 'full':
          if (!regData.firstName || !regData.lastName || !regData.dateOfBirth ||
              !regData.street || !regData.city || !regData.postalCode || !regData.country) {
            throw new Error('Full registration data required for transactions of 10 euros or more');
          }
          user = await userService.findOrCreateFullUser({
            email: regData.email,
            firstName: regData.firstName,
            lastName: regData.lastName,
            dateOfBirth: regData.dateOfBirth,
            street: regData.street,
            city: regData.city,
            postalCode: regData.postalCode,
            country: regData.country,
            state: regData.state,
            termsAccepted: regData.termsAccepted,
          });
          break;
      }
    } else {
      throw new Error('Either userId or registrationData is required');
    }

    // 8. For GIFT_CARD, validate and redeem the code now that we have user
    if (sku.paymentMode === PaymentMode.GIFT_CARD && input.giftCardCode) {
      const giftCard = await giftCardService.validateAndRedeemCode(
        input.giftCardCode,
        user.id
      );
      giftCardCodeId = giftCard.id;
    }

    // 9. Create transaction with all 3 attribution IDs:
    // - masterId: Marcello's ID for overall network tracking
    // - merchantId: The specific business/seller
    // - partnerId: Who brought the merchant onboard (for royalty calculation)
    const transaction = await Transaction.create({
      userId: user.id,
      skuId: sku.id,
      masterId,
      merchantId: input.merchantId,
      partnerId: input.partnerId,
      orderId: input.orderId,
      amount: transactionAmount,
      calculatedImpact,
      paymentStatus,
      giftCardCodeId,
      corsairConnectFlag,
    });

    // 10. Update wallet for completed transactions
    // Section 6.2: Pass transaction amount and threshold for accumulation tracking
    if (paymentStatus === PaymentStatus.COMPLETED || paymentStatus === PaymentStatus.NA) {
      await walletService.updateWalletBalance(
        user.id,
        calculatedImpact,
        'user',
        transactionAmount,
        corsairThreshold
      );
      if (input.merchantId) {
        await walletService.updateWalletBalance(
          input.merchantId,
          calculatedImpact,
          'merchant',
          transactionAmount,
          corsairThreshold
        );
      }
    }

    // 11. Update user's corsairConnectFlag if transaction triggers it
    const previousCorsairFlag = user.corsairConnectFlag;
    if (corsairConnectFlag && !user.corsairConnectFlag) {
      await userService.setCorsairConnectFlag(user.id, true);
    }

    // 12. Send transaction confirmation email (Section 15.2)
    // Send for completed transactions (COMPLETED or NA status)
    if (paymentStatus === PaymentStatus.COMPLETED || paymentStatus === PaymentStatus.NA) {
      const userName = user.firstName || 'Guest';
      const impactKg = (calculatedImpact / 1000).toFixed(3);
      const transactionDate = new Date().toISOString().split('T')[0];

      // Generate certificate URL if this is a certified asset (≥€10)
      const certificateUrl = corsairConnectFlag
        ? `${env.frontend.url}/api/certificates/${transaction.id}/download`
        : undefined;

      await emailService.sendTransactionConfirmation(
        user.email,
        userName,
        {
          id: transaction.id,
          impactGrams: calculatedImpact,
          impactKg,
          date: transactionDate,
          sku: { code: sku.code, name: sku.name },
          amount: transactionAmount,
        },
        user.id,
        certificateUrl
      );
    }

    // 13. Send threshold achievement email if user just crossed €10 threshold (Section 15.3)
    // Only send if this transaction caused the threshold to be crossed (not previously flagged)
    if (corsairConnectFlag && !previousCorsairFlag) {
      const userName = user.firstName || 'Guest';
      const wallet = await walletService.getUserWallet(user.id);
      const totalImpactKg = Number(wallet.wallet.totalAccumulated) / 1000;
      const totalAmountSpent = Number(wallet.wallet.totalAmountSpent);

      const certificateUrl = `${env.frontend.url}/api/certificates/${transaction.id}/download`;

      await emailService.sendThresholdAchievement(
        user.email,
        userName,
        totalImpactKg,
        totalAmountSpent,
        user.id,
        certificateUrl
      );
    }

    // 14. Return transaction with associations
    return await this.getTransactionById(transaction.id);
  }

  /**
   * Get transaction by ID with all associations
   */
  async getTransactionById(id: string) {
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
        { model: GiftCardCode, as: 'giftCardCode' },
      ],
    });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  /**
   * Get transactions for a user (for user dashboard)
   */
  async getTransactionsByUserId(userId: string) {
    return await Transaction.findAll({
      where: { userId },
      include: [{ model: SKU, as: 'sku' }],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get transactions for a merchant (for merchant dashboard)
   */
  async getTransactionsByMerchantId(merchantId: string) {
    return await Transaction.findAll({
      where: { merchantId },
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get transactions for a partner (for partner reporting)
   */
  async getTransactionsByPartnerId(partnerId: string) {
    return await Transaction.findAll({
      where: { partnerId },
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get all transactions with optional filters (for admin)
   * Supports filtering by all 3 attribution IDs: masterId, merchantId, partnerId
   */
  async getAllTransactions(filters: {
    userId?: string;
    masterId?: string;
    merchantId?: string;
    partnerId?: string;
    corsairConnectFlag?: boolean;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.masterId) where.masterId = filters.masterId;
    if (filters.merchantId) where.merchantId = filters.merchantId;
    if (filters.partnerId) where.partnerId = filters.partnerId;
    if (filters.corsairConnectFlag !== undefined) where.corsairConnectFlag = filters.corsairConnectFlag;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = filters.startDate;
      if (filters.endDate) where.createdAt[Op.lte] = filters.endDate;
    }

    return await Transaction.findAll({
      where,
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Update transaction payment status (called by Stripe webhook)
   */
  async updatePaymentStatus(
    transactionId: string,
    paymentStatus: PaymentStatus,
    stripePaymentIntentId?: string
  ) {
    const transaction = await this.getTransactionById(transactionId);

    await transaction.update({
      paymentStatus,
      stripePaymentIntentId,
    });

    // If payment just completed, update wallets
    // Section 6.2: Pass transaction amount and threshold for accumulation tracking
    if (paymentStatus === PaymentStatus.COMPLETED) {
      const corsairThreshold = await configService.getCorsairThreshold();

      await walletService.updateWalletBalance(
        transaction.userId,
        Number(transaction.calculatedImpact),
        'user',
        Number(transaction.amount),
        corsairThreshold
      );
      if (transaction.merchantId) {
        await walletService.updateWalletBalance(
          transaction.merchantId,
          Number(transaction.calculatedImpact),
          'merchant',
          Number(transaction.amount),
          corsairThreshold
        );
      }

      // Update user's corsairConnectFlag if applicable
      const user = transaction.user;
      const previousCorsairFlag = user.corsairConnectFlag;
      if (transaction.corsairConnectFlag && !user.corsairConnectFlag) {
        await userService.setCorsairConnectFlag(transaction.userId, true);
      }

      // Send transaction confirmation email (Section 15.2)
      const userName = user.firstName || 'Guest';
      const impactKg = (Number(transaction.calculatedImpact) / 1000).toFixed(3);
      const transactionDate = transaction.createdAt.toISOString().split('T')[0];
      const sku = transaction.sku;

      // Generate certificate URL if this is a certified asset (≥€10)
      const certificateUrl = transaction.corsairConnectFlag
        ? `${env.frontend.url}/api/certificates/${transaction.id}/download`
        : undefined;

      await emailService.sendTransactionConfirmation(
        user.email,
        userName,
        {
          id: transaction.id,
          impactGrams: Number(transaction.calculatedImpact),
          impactKg,
          date: transactionDate,
          sku: { code: sku.code, name: sku.name },
          amount: Number(transaction.amount),
        },
        user.id,
        certificateUrl
      );

      // Send threshold achievement email if user just crossed €10 threshold (Section 15.3)
      if (transaction.corsairConnectFlag && !previousCorsairFlag) {
        const wallet = await walletService.getUserWallet(user.id);
        const totalImpactKg = Number(wallet.wallet.totalAccumulated) / 1000;
        const totalAmountSpent = Number(wallet.wallet.totalAmountSpent);

        const thresholdCertificateUrl = `${env.frontend.url}/api/certificates/${transaction.id}/download`;

        await emailService.sendThresholdAchievement(
          user.email,
          userName,
          totalImpactKg,
          totalAmountSpent,
          user.id,
          thresholdCertificateUrl
        );
      }
    }

    return transaction;
  }

  /**
   * Get user's total impact (sum of all completed transactions)
   */
  async getUserTotalImpact(userId: string): Promise<number> {
    const result = await Transaction.sum('calculatedImpact', {
      where: {
        userId,
        paymentStatus: [PaymentStatus.COMPLETED, PaymentStatus.NA],
      },
    });
    return result || 0;
  }

  /**
   * Manual transaction creation (admin only) - Section 9.5
   * Creates a transaction directly without payment processing
   * Used for corrections, refunds, manual entries
   */
  async createManualTransaction(input: {
    userId: string;
    skuCode: string;
    amount: number;
    merchantId?: string;
    partnerId?: string;
    orderId?: string;
    reason: string; // Admin notes explaining why this manual transaction was created
    createdBy: string; // Admin who created it
  }) {
    // 1. Get SKU information
    const sku = await skuService.getSKUByCode(input.skuCode);
    if (!sku.isActive) {
      throw new Error('This SKU is no longer active');
    }

    // 2. Verify user exists
    const user = await userService.getUserById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Get global config values
    // Note: ALLOCATION_MULTIPLIER is no longer used - all modes use same formula
    const currentCSRPrice = await configService.getCurrentCSRPrice();
    const masterId = await configService.getMasterId();
    const corsairThreshold = await configService.getCorsairThreshold();

    // 4. Calculate impact - UNIVERSAL FORMULA for ALL payment modes
    // Per client clarification: ALL modes use (amount / CSR_PRICE) * multiplier * 1000
    const calculatedImpact = this.calculateImpactGrams(
      input.amount,
      currentCSRPrice,
      Number(sku.impactMultiplier)
    );

    // 5. Determine Corsair Connect flag
    const corsairConnectFlag = input.amount >= corsairThreshold;

    // 6. Create transaction
    // Manual transactions are always marked as COMPLETED (admin bypass)
    const transaction = await Transaction.create({
      userId: input.userId,
      skuId: sku.id,
      masterId,
      merchantId: input.merchantId,
      partnerId: input.partnerId,
      orderId: input.orderId || `MANUAL-${Date.now()}`,
      amount: input.amount,
      calculatedImpact,
      paymentStatus: PaymentStatus.COMPLETED,
      corsairConnectFlag,
      // Store admin notes in a field (we'd need to add this to model, or use orderId)
    });

    // 7. Update wallets
    await walletService.updateWalletBalance(
      user.id,
      calculatedImpact,
      'user',
      input.amount,
      corsairThreshold
    );
    if (input.merchantId) {
      await walletService.updateWalletBalance(
        input.merchantId,
        calculatedImpact,
        'merchant',
        input.amount,
        corsairThreshold
      );
    }

    // 8. Update user's corsairConnectFlag if transaction triggers it
    if (corsairConnectFlag && !user.corsairConnectFlag) {
      await userService.setCorsairConnectFlag(user.id, true);
    }

    // 9. Return transaction with associations
    return await this.getTransactionById(transaction.id);
  }
}

export default new TransactionService();
