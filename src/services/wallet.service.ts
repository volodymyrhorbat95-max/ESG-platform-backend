// Wallet Service - Business logic for wallet management
// CRITICAL: getWalletWithHistory must include SKU association for transaction history display

import { Wallet, User, Merchant, Transaction, SKU, WalletAdjustment } from '../database/models/index.js';

type WalletType = 'user' | 'merchant';

class WalletService {
  // Find or create wallet
  async findOrCreateWallet(ownerId: string, type: WalletType) {
    const where = type === 'user' ? { userId: ownerId } : { merchantId: ownerId };

    let wallet = await Wallet.findOne({ where });

    if (!wallet) {
      // Explicitly set userId or merchantId to avoid spread syntax issues
      if (type === 'user') {
        wallet = await Wallet.create({
          userId: ownerId,
          totalAccumulated: 0,
          totalRedeemed: 0,
          currentBalance: 0,
        });
      } else {
        wallet = await Wallet.create({
          merchantId: ownerId,
          totalAccumulated: 0,
          totalRedeemed: 0,
          currentBalance: 0,
        });
      }
    }

    return wallet;
  }

  // Update wallet balance (atomic operation)
  // Section 6.2: Now also tracks euro amounts and certified asset status
  async updateWalletBalance(
    ownerId: string,
    impactGrams: number,
    type: WalletType,
    transactionAmount: number = 0,
    corsairThreshold: number = 10
  ) {
    const wallet = await this.findOrCreateWallet(ownerId, type);

    const newTotalAccumulated = Number(wallet.totalAccumulated) + impactGrams;
    const newCurrentBalance = newTotalAccumulated - Number(wallet.totalRedeemed);
    const newTotalAmountSpent = Number(wallet.totalAmountSpent) + transactionAmount;

    // Section 6.2: Check if threshold reached to update certified asset status
    const certifiedAssetStatus = newTotalAmountSpent >= corsairThreshold;

    await wallet.update({
      totalAccumulated: newTotalAccumulated,
      currentBalance: newCurrentBalance,
      totalAmountSpent: newTotalAmountSpent,
      certifiedAssetStatus,
    });

    return wallet;
  }

  // Get wallet with transaction history
  // CRITICAL: Includes SKU association for displaying SKU code/name in transaction history table
  // PAGINATION: Added limit and offset parameters to support large transaction lists
  async getWalletWithHistory(
    ownerId: string,
    type: WalletType,
    options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {}
  ) {
    const wallet = await this.findOrCreateWallet(ownerId, type);

    // Build where clause
    const where: any = type === 'user' ? { userId: ownerId } : { merchantId: ownerId };

    // Add date range filtering if provided
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt = { ...where.createdAt, $gte: options.startDate };
      }
      if (options.endDate) {
        where.createdAt = { ...where.createdAt, $lte: options.endDate };
      }
    }

    // Get associated transactions with SKU data for display
    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: SKU,
          as: 'sku',
          attributes: ['id', 'code', 'name', 'paymentMode'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: options.limit || 100, // Default to 100 transactions (increased from 50)
      offset: options.offset || 0,
    });

    return {
      wallet,
      transactions,
    };
  }

  // Get user wallet by user ID with optional pagination and date filtering
  async getUserWallet(userId: string, options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {}) {
    return await this.getWalletWithHistory(userId, 'user', options);
  }

  // Get merchant wallet by merchant ID with optional pagination and date filtering
  async getMerchantWallet(merchantId: string, options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {}) {
    return await this.getWalletWithHistory(merchantId, 'merchant', options);
  }

  // Handle redemption (update totalRedeemed and recalculate balance)
  async redeemWalletBalance(ownerId: string, redeemAmountGrams: number, type: WalletType) {
    const wallet = await this.findOrCreateWallet(ownerId, type);

    // Validate redemption amount
    if (redeemAmountGrams <= 0) {
      throw new Error('Redemption amount must be positive');
    }

    const currentBalance = Number(wallet.currentBalance);
    if (redeemAmountGrams > currentBalance) {
      throw new Error(`Insufficient balance. Available: ${currentBalance}g, Requested: ${redeemAmountGrams}g`);
    }

    const newTotalRedeemed = Number(wallet.totalRedeemed) + redeemAmountGrams;
    const newCurrentBalance = Number(wallet.totalAccumulated) - newTotalRedeemed;

    await wallet.update({
      totalRedeemed: newTotalRedeemed,
      currentBalance: newCurrentBalance,
    });

    return wallet;
  }

  // Manual wallet adjustment (admin only) - Section 9.4
  // Adjusts wallet balance and creates audit log entry
  async adjustWallet(userId: string, amountGrams: number, reason: string, adjustedBy: string) {
    const wallet = await this.findOrCreateWallet(userId, 'user');

    // Validate adjustment
    if (amountGrams === 0) {
      throw new Error('Adjustment amount cannot be zero');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for wallet adjustments');
    }

    const currentBalance = Number(wallet.currentBalance);
    const newTotalAccumulated = Number(wallet.totalAccumulated) + amountGrams;
    const newCurrentBalance = currentBalance + amountGrams;

    // Prevent negative balance
    if (newCurrentBalance < 0) {
      throw new Error(`Adjustment would result in negative balance. Current: ${currentBalance}g, Adjustment: ${amountGrams}g`);
    }

    // Update wallet
    await wallet.update({
      totalAccumulated: newTotalAccumulated,
      currentBalance: newCurrentBalance,
    });

    // Create audit log entry
    const adjustment = await WalletAdjustment.create({
      userId,
      amount: amountGrams,
      reason: reason.trim(),
      adjustedBy,
    });

    return { wallet, adjustment };
  }

  // Get wallet adjustment history for a user (admin only) - Section 9.4
  async getAdjustmentHistory(userId: string) {
    return await WalletAdjustment.findAll({
      where: { userId },
      order: [['adjustedAt', 'DESC']],
    });
  }
}

export default new WalletService();
