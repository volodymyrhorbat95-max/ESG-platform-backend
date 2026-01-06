// Transaction Service - Business logic for transaction processing
// Handles ALL 4 SKU types: CLAIM, PAY, GIFT_CARD, ALLOCATION

import { Transaction, PaymentStatus, SKU, PaymentMode, User, Wallet, GiftCardCode } from '../database/models/index.js';
import userService from './user.service.js';
import walletService from './wallet.service.js';
import giftCardService from './giftCard.service.js';
import skuService from './sku.service.js';

interface CreateTransactionData {
  skuCode: string;
  userId?: string;
  merchantId?: string;
  partnerId?: string;
  orderId?: string;
  amount?: number; // For ALLOCATION type
  giftCardCode?: string; // For GIFT_CARD type
  registrationData: {
    email: string; // Required for all types
    firstName?: string; // Optional for CLAIM, required for others
    lastName?: string;
    dateOfBirth?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    state?: string;
    termsAccepted?: boolean;
  };
}

class TransactionService {
  // Main transaction creation - handles all 4 SKU types
  async createTransaction(data: CreateTransactionData) {
    // 1. Get SKU information
    const sku = await skuService.getSKUByCode(data.skuCode);

    // 2. Find or create user (handle minimal data for CLAIM type)
    let user: User;
    if (data.userId) {
      user = await userService.getUserById(data.userId);
    } else {
      // For CLAIM type, only email is required
      if (sku.paymentMode === PaymentMode.CLAIM) {
        user = await userService.findOrCreateMinimalUser(data.registrationData.email);
      } else {
        // For PAY, GIFT_CARD, ALLOCATION - full registration required
        if (!data.registrationData.firstName || !data.registrationData.lastName ||
            !data.registrationData.dateOfBirth || !data.registrationData.street ||
            !data.registrationData.city || !data.registrationData.postalCode ||
            !data.registrationData.country || !data.registrationData.state ||
            data.registrationData.termsAccepted === undefined) {
          throw new Error('Full registration data required for this transaction type');
        }
        user = await userService.findOrCreateUser(data.registrationData as any);
      }
    }

    // 3. Determine transaction amount and impact based on SKU type
    let transactionAmount = 0;
    let calculatedImpact = 0;
    let paymentStatus = PaymentStatus.NA;
    let giftCardCodeId: string | undefined;

    switch (sku.paymentMode) {
      case PaymentMode.CLAIM:
        // Type 1: Prepaid Lot - No payment, instant confirmation
        transactionAmount = 0;
        calculatedImpact = sku.gramsWeight;
        paymentStatus = PaymentStatus.NA;
        break;

      case PaymentMode.PAY:
        // Type 2: Pay-as-you-go - Stripe payment required
        transactionAmount = Number(sku.price);
        calculatedImpact = sku.gramsWeight;
        paymentStatus = PaymentStatus.PENDING;
        break;

      case PaymentMode.GIFT_CARD:
        // Type 3: Gift Card - Secret code validation required
        if (!data.giftCardCode) {
          throw new Error('Gift card code is required');
        }
        const giftCard = await giftCardService.validateAndRedeemCode(
          data.giftCardCode,
          user.id
        );
        giftCardCodeId = giftCard.id;
        transactionAmount = Number(sku.price);
        calculatedImpact = sku.gramsWeight;
        paymentStatus = PaymentStatus.COMPLETED; // Paid externally
        break;

      case PaymentMode.ALLOCATION:
        // Type 4: Environmental Allocation - Dynamic calculation
        if (!data.amount) {
          throw new Error('Amount is required for allocation type');
        }
        transactionAmount = data.amount;
        // Calculate impact: amount × multiplier
        calculatedImpact = skuService.calculateAllocationImpact(
          data.amount,
          Number(sku.impactMultiplier)
        );
        paymentStatus = PaymentStatus.NA;
        break;

      default:
        throw new Error(`Unknown payment mode: ${sku.paymentMode}`);
    }

    // 4. Check if should flag for Amplivo
    const amplivoFlag = skuService.shouldFlagForAmplivo(
      transactionAmount,
      Number(sku.amplivoThreshold)
    );

    // 5. Create transaction
    const transaction = await Transaction.create({
      userId: user.id,
      skuId: sku.id,
      merchantId: data.merchantId,
      partnerId: data.partnerId,
      orderId: data.orderId,
      amount: transactionAmount,
      calculatedImpact,
      paymentStatus,
      giftCardCodeId,
      amplivoFlag,
    });

    // 6. Update wallets (for completed or N/A transactions)
    if (paymentStatus === PaymentStatus.COMPLETED || paymentStatus === PaymentStatus.NA) {
      await walletService.updateWalletBalance(user.id, calculatedImpact, 'user');
      if (data.merchantId) {
        await walletService.updateWalletBalance(data.merchantId, calculatedImpact, 'merchant');
      }
    }

    // 7. Return transaction with related data
    return await this.getTransactionById(transaction.id);
  }

  // Get transaction by ID with associations
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

  // Get all transactions with filters
  async getAllTransactions(filters: {
    userId?: string;
    merchantId?: string;
    partnerId?: string;
    amplivoFlag?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.merchantId) where.merchantId = filters.merchantId;
    if (filters.partnerId) where.partnerId = filters.partnerId;
    if (filters.amplivoFlag !== undefined) where.amplivoFlag = filters.amplivoFlag;
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

  // Update transaction payment status (after Stripe webhook)
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

    // If payment completed, update wallets
    if (paymentStatus === PaymentStatus.COMPLETED) {
      await walletService.updateWalletBalance(
        transaction.userId,
        transaction.calculatedImpact,
        'user'
      );
      if (transaction.merchantId) {
        await walletService.updateWalletBalance(
          transaction.merchantId,
          transaction.calculatedImpact,
          'merchant'
        );
      }
    }

    return transaction;
  }
}

export default new TransactionService();
