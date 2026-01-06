// Wallet Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import walletService from '../services/wallet.service.js';

class WalletController {
  // GET /api/user/wallet - Get authenticated user's wallet (from session/token)
  async getUserWallet(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Get userId from authenticated session/JWT token
      // For now, require userId in query parameter
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID required',
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

  // GET /api/merchant/wallet - Get authenticated merchant's wallet (from session/token)
  async getMerchantWallet(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Get merchantId from authenticated session/JWT token
      // For now, require merchantId in query parameter
      const merchantId = req.query.merchantId as string;
      if (!merchantId) {
        return res.status(400).json({
          success: false,
          error: 'Merchant ID required',
        });
      }

      const data = await walletService.getMerchantWallet(merchantId);
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
}

export default new WalletController();
