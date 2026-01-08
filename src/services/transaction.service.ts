// Transaction Service - Business logic for transaction processing
// Handles ALL 4 SKU types: CLAIM, PAY, GIFT_CARD, ALLOCATION
// CRITICAL: Impact calculated dynamically using CURRENT_CSR_PRICE from GlobalConfig
// Formula: impactGrams = (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000

import { Transaction, SKU, User, GiftCardCode } from '../database/models/index.js';
import { PaymentMode } from '../database/models/SKU.js';
import { PaymentStatus } from '../database/models/Transaction.js';
import userService from './user.service.js';
import walletService from './wallet.service.js';
import giftCardService from './giftCard.service.js';
import skuService from './sku.service.js';
import configService from './config.service.js';

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
   * Calculate impact in grams
   * Formula: (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000
   * Example: (25 / 0.11) * 1 * 1000 = 227,272 grams
   */
  calculateImpactGrams(amount: number, currentCSRPrice: number, impactMultiplier: number): number {
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

    // 2. Get current CSR price for dynamic impact calculation
    const currentCSRPrice = await configService.getCurrentCSRPrice();

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

    // 4. Calculate impact in grams using unified formula
    // Formula: (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000
    const calculatedImpact = this.calculateImpactGrams(
      transactionAmount,
      currentCSRPrice,
      Number(sku.impactMultiplier)
    );

    // 5. Check if should flag for Corsair Connect (10+ euro threshold)
    const corsairConnectFlag = transactionAmount >= Number(sku.corsairThreshold);

    // 6. Determine required registration level
    const requiredLevel = this.determineRegistrationLevel(
      transactionAmount,
      Number(sku.corsairThreshold)
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

    // 9. Create transaction
    const transaction = await Transaction.create({
      userId: user.id,
      skuId: sku.id,
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
    if (paymentStatus === PaymentStatus.COMPLETED || paymentStatus === PaymentStatus.NA) {
      await walletService.updateWalletBalance(user.id, calculatedImpact, 'user');
      if (input.merchantId) {
        await walletService.updateWalletBalance(input.merchantId, calculatedImpact, 'merchant');
      }
    }

    // 11. Update user's corsairConnectFlag if transaction triggers it
    if (corsairConnectFlag && !user.corsairConnectFlag) {
      await userService.setCorsairConnectFlag(user.id, true);
    }

    // 12. Return transaction with associations
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
   */
  async getAllTransactions(filters: {
    userId?: string;
    merchantId?: string;
    partnerId?: string;
    corsairConnectFlag?: boolean;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.merchantId) where.merchantId = filters.merchantId;
    if (filters.partnerId) where.partnerId = filters.partnerId;
    if (filters.corsairConnectFlag !== undefined) where.corsairConnectFlag = filters.corsairConnectFlag;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.$gte = filters.startDate;
      if (filters.endDate) where.createdAt.$lte = filters.endDate;
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
    if (paymentStatus === PaymentStatus.COMPLETED) {
      await walletService.updateWalletBalance(
        transaction.userId,
        Number(transaction.calculatedImpact),
        'user'
      );
      if (transaction.merchantId) {
        await walletService.updateWalletBalance(
          transaction.merchantId,
          Number(transaction.calculatedImpact),
          'merchant'
        );
      }

      // Update user's corsairConnectFlag if applicable
      if (transaction.corsairConnectFlag) {
        await userService.setCorsairConnectFlag(transaction.userId, true);
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
}

export default new TransactionService();
