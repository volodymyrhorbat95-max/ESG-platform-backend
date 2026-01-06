// Gift Card Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import giftCardService from '../services/giftCard.service.js';

class GiftCardController {
  // POST /api/gift-cards/validate - Validate gift card code
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, userId } = req.body;
      const giftCard = await giftCardService.validateAndRedeemCode(code, userId);
      res.json({
        success: true,
        data: giftCard,
        message: 'Gift card code validated successfully',
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
}

export default new GiftCardController();
