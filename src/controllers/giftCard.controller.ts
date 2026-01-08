// Gift Card Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import giftCardService from '../services/giftCard.service.js';

class GiftCardController {
  // POST /api/validate-code - Validate gift card code (validation only, no redemption)
  // Redemption happens during transaction creation to ensure the real user ID is used
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      // Validate without redeeming - redemption happens in transaction.service.ts
      const giftCard = await giftCardService.validateCode(code);
      res.json({
        success: true,
        data: giftCard,
        message: 'Gift card code is valid',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/gift-cards/bulk - Bulk create gift card codes
  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const codes = await giftCardService.createGiftCardCodes(req.body);
      res.status(201).json({
        success: true,
        data: codes,
        message: `${codes.length} gift card codes created successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/gift-cards - Get all gift card codes with filters
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        isRedeemed: req.query.isRedeemed === 'true' ? true : req.query.isRedeemed === 'false' ? false : undefined,
        skuId: req.query.skuId as string,
      };
      const codes = await giftCardService.getAllCodes(filters);
      res.json({
        success: true,
        data: codes,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/gift-cards/:code - Get gift card code status
  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const giftCard = await giftCardService.getCodeStatus(req.params.code);
      res.json({
        success: true,
        data: giftCard,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/gift-cards/sku/:skuId - Get codes by SKU
  async getBySKU(req: Request, res: Response, next: NextFunction) {
    try {
      const redeemedOnly = req.query.redeemed === 'true';
      const codes = await giftCardService.getCodesBySKU(req.params.skuId, redeemedOnly);
      res.json({
        success: true,
        data: codes,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/gift-cards/:code - Invalidate a single gift card code (admin action)
  async invalidate(req: Request, res: Response, next: NextFunction) {
    try {
      const giftCard = await giftCardService.invalidateCode(req.params.code);
      res.json({
        success: true,
        data: giftCard,
        message: 'Gift card code invalidated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/gift-cards/invalidate-bulk - Invalidate multiple gift card codes (admin action)
  async invalidateBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { codes } = req.body;
      if (!codes || !Array.isArray(codes) || codes.length === 0) {
        res.status(400).json({
          success: false,
          error: 'codes array is required',
        });
        return;
      }
      const results = await giftCardService.invalidateCodes(codes);
      const successCount = results.filter(r => r.success).length;
      res.json({
        success: true,
        data: results,
        message: `${successCount} of ${codes.length} gift card codes invalidated`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GiftCardController();
