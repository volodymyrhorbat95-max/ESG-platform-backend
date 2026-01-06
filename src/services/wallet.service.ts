// Wallet Service - Business logic for wallet management

import { Wallet, User, Merchant, Transaction } from '../database/models/index.js';

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
  async updateWalletBalance(ownerId: string, impactGrams: number, type: WalletType) {
    const wallet = await this.findOrCreateWallet(ownerId, type);

    const newTotalAccumulated = Number(wallet.totalAccumulated) + impactGrams;
    const newCurrentBalance = newTotalAccumulated - Number(wallet.totalRedeemed);

    await wallet.update({
      totalAccumulated: newTotalAccumulated,
      currentBalance: newCurrentBalance,
    });

    return wallet;
  }

  // Get wallet with transaction history
  async getWalletWithHistory(ownerId: string, type: WalletType) {
    const wallet = await this.findOrCreateWallet(ownerId, type);

    // Get associated transactions
    const where = type === 'user' ? { userId: ownerId } : { merchantId: ownerId };
    const transactions = await Transaction.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50, // Latest 50 transactions
    });

    return {
      wallet,
      transactions,
    };
  }

  // Get user wallet by user ID
  async getUserWallet(userId: string) {
    return await this.getWalletWithHistory(userId, 'user');
  }

  // Get merchant wallet by merchant ID
  async getMerchantWallet(merchantId: string) {
    return await this.getWalletWithHistory(merchantId, 'merchant');
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
}

export default new WalletService();
