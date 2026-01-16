// TransactionToken Controller - NO business logic, only HTTP handling
// Section 20.4: E-commerce Integration - Token-based transaction access
import { Request, Response, NextFunction } from 'express';
import transactionTokenService from '../services/transactionToken.service.js';

class TransactionTokenController {
  /**
   * GET /api/transactions/token/:transactionId/:token
   * Validate token and return transaction data for e-commerce landing page
   *
   * This is a PUBLIC endpoint - no auth required (token IS the auth)
   * Called by frontend when customer accesses /landing?txn={id}&token={token}
   */
  async getTransactionByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, token } = req.params;

      if (!transactionId || !token) {
        return res.status(400).json({
          success: false,
          error: 'Transaction ID and token are required',
        });
      }

      // Validate token and get transaction data
      const result = await transactionTokenService.validateTokenAndGetTransaction(
        transactionId,
        token
      );

      // Return transaction data formatted for e-commerce landing page
      // Note: We only return safe, public-facing data
      res.json({
        success: true,
        data: {
          transaction: {
            id: result.transaction.id,
            amount: result.transaction.amount,
            calculatedImpact: result.transaction.calculatedImpact,
            paymentStatus: result.transaction.paymentStatus,
            corsairConnectFlag: result.transaction.corsairConnectFlag,
            createdAt: result.transaction.createdAt,
          },
          user: {
            // Only return first name for personalization
            firstName: result.user.firstName,
            // Don't expose email or other PII
          },
          sku: {
            id: result.sku.id,
            code: result.sku.code,
            name: result.sku.name,
            paymentMode: result.sku.paymentMode,
          },
          tokenInfo: {
            accessCount: result.tokenRecord.accessCount,
            firstAccessedAt: result.tokenRecord.usedAt,
          },
        },
      });
    } catch (error: any) {
      // Handle specific errors
      if (error.message === 'Invalid token') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired access link',
        });
      }
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          error: 'This access link has expired. Please contact support.',
        });
      }
      if (error.message === 'Transaction not found') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/transactions/:transactionId/generate-token
   * Generate a new token for a transaction (admin or webhook use)
   */
  async generateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;
      const { expirationDays } = req.body;

      const token = await transactionTokenService.createToken(
        transactionId,
        expirationDays
      );

      // Generate full impact URL
      const baseUrl = process.env.FRONTEND_URL || 'https://csr26.it';
      const impactUrl = transactionTokenService.generateImpactUrl(
        transactionId,
        token.token,
        baseUrl
      );

      res.status(201).json({
        success: true,
        data: {
          tokenId: token.id,
          transactionId: token.transactionId,
          expiresAt: token.expiresAt,
          impactUrl,
        },
        message: 'Token generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionTokenController();
