// Wallet Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import walletService from '../services/wallet.service.js';

class WalletController {
  // GET /api/user/wallet - Get authenticated user's wallet (from JWT token)
  // REQUIRES: requireAuth middleware to extract userId from JWT
  async getUserWallet(req: Request, res: Response, next: NextFunction) {
    try {
      // Get userId from authenticated JWT token (set by requireAuth middleware)
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const data = await walletService.getUserWallet(userId);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/merchant/wallet - Get authenticated merchant's wallet
  // Supports pagination and date filtering via query parameters
  // Query params: merchantId, limit, offset, startDate, endDate
  async getMerchantWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const merchantId = req.query.merchantId as string;
      if (!merchantId) {
        return res.status(400).json({
          success: false,
          error: 'Merchant ID required',
        });
      }

      // Parse optional pagination and filtering parameters
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await walletService.getMerchantWallet(merchantId, options);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/wallets/user/:userId - Get user wallet by ID (admin/internal)
  async getUserWalletById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await walletService.getUserWallet(req.params.userId);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/wallets/merchant/:merchantId - Get merchant wallet by ID (admin/internal)
  async getMerchantWalletById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await walletService.getMerchantWallet(req.params.merchantId);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/users/:userId/wallet/adjust - Manual wallet adjustment (admin only) - Section 9.4
  async adjustWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { amount, reason } = req.body;

      // Validate inputs
      if (amount === undefined || amount === null) {
        return res.status(400).json({
          success: false,
          error: 'Amount is required',
        });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Reason is required',
        });
      }

      const amountGrams = Number(amount);
      if (isNaN(amountGrams)) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a valid number',
        });
      }

      // Get admin identifier from request
      const adjustedBy = (req as any).adminEmail || 'admin';

      const result = await walletService.adjustWallet(userId, amountGrams, reason, adjustedBy);

      res.json({
        success: true,
        data: result,
        message: `Wallet adjusted by ${amountGrams}g`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/:userId/wallet/adjustments - Get adjustment history (admin only) - Section 9.4
  async getAdjustmentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adjustments = await walletService.getAdjustmentHistory(userId);

      res.json({
        success: true,
        data: adjustments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();
