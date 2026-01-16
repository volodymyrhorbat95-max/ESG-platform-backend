// TransactionToken Service
// Section 20.4: E-commerce Integration - Secure tokenized URLs for post-purchase access
//
// Purpose: Generate and validate secure tokens that allow e-commerce customers
// to access their impact landing page without logging in.

import crypto from 'crypto';
import { Op } from 'sequelize';
import { TransactionToken, Transaction, SKU, User } from '../database/models/index.js';

// Default token expiration: 30 days
const DEFAULT_TOKEN_EXPIRATION_DAYS = 30;

class TransactionTokenService {
  /**
   * Generate a secure random token (32 bytes = 64 hex chars)
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new token for a transaction
   * Called after e-commerce webhook creates a transaction
   *
   * @param transactionId - The transaction ID to create a token for
   * @param expirationDays - Days until token expires (default: 30)
   * @returns The created TransactionToken
   */
  async createToken(
    transactionId: string,
    expirationDays: number = DEFAULT_TOKEN_EXPIRATION_DAYS
  ): Promise<TransactionToken> {
    // Verify transaction exists
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Generate secure token
    const token = this.generateSecureToken();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create token record
    const transactionToken = await TransactionToken.create({
      transactionId,
      token,
      expiresAt,
    });

    console.log(`✅ Created transaction token for transaction ${transactionId}`);

    return transactionToken;
  }

  /**
   * Validate a token and return the associated transaction data
   * Called when customer accesses /landing?txn={id}&token={token}
   *
   * @param transactionId - The transaction ID from URL
   * @param token - The token from URL
   * @returns Transaction with user and SKU data if valid
   * @throws Error if token is invalid or expired
   */
  async validateTokenAndGetTransaction(
    transactionId: string,
    token: string
  ): Promise<{
    transaction: Transaction;
    user: User;
    sku: any;
    tokenRecord: TransactionToken;
  }> {
    // Find token record
    const tokenRecord = await TransactionToken.findOne({
      where: {
        transactionId,
        token,
      },
    });

    if (!tokenRecord) {
      throw new Error('Invalid token');
    }

    // Check if expired
    if (tokenRecord.isExpired()) {
      throw new Error('Token has expired');
    }

    // Get transaction with associations
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update token usage stats
    await tokenRecord.update({
      usedAt: tokenRecord.usedAt || new Date(), // Only set first use time
      accessCount: tokenRecord.accessCount + 1,
    });

    console.log(`✅ Token validated for transaction ${transactionId} (access #${tokenRecord.accessCount + 1})`);

    return {
      transaction,
      user: transaction.user,
      sku: transaction.sku,
      tokenRecord,
    };
  }

  /**
   * Get token by transaction ID
   * Used to retrieve existing token for a transaction
   */
  async getTokenByTransactionId(transactionId: string): Promise<TransactionToken | null> {
    return await TransactionToken.findOne({
      where: { transactionId },
      order: [['createdAt', 'DESC']], // Get most recent token
    });
  }

  /**
   * Get or create token for a transaction
   * Useful when you want to ensure a token exists
   */
  async getOrCreateToken(transactionId: string): Promise<TransactionToken> {
    // Try to find existing valid token
    const existingToken = await TransactionToken.findOne({
      where: {
        transactionId,
        expiresAt: { [Op.gt]: new Date() }, // Not expired
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingToken) {
      return existingToken;
    }

    // Create new token
    return await this.createToken(transactionId);
  }

  /**
   * Generate the full impact URL for e-commerce thank-you page
   * @param transactionId - Transaction ID
   * @param token - Token string
   * @param baseUrl - Frontend base URL
   */
  generateImpactUrl(transactionId: string, token: string, baseUrl: string): string {
    return `${baseUrl}/landing?txn=${transactionId}&token=${token}`;
  }

  /**
   * Clean up expired tokens (maintenance task)
   * Should be called periodically (e.g., daily cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await TransactionToken.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    console.log(`🧹 Cleaned up ${result} expired transaction tokens`);

    return result;
  }

  /**
   * Revoke all tokens for a transaction
   * Useful for security purposes
   */
  async revokeTokensForTransaction(transactionId: string): Promise<number> {
    const result = await TransactionToken.destroy({
      where: { transactionId },
    });

    console.log(`🔒 Revoked ${result} tokens for transaction ${transactionId}`);

    return result;
  }
}

export default new TransactionTokenService();
