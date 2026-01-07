// SKU Localization Controller - HTTP handling for multi-market SKU support
import { Request, Response, NextFunction } from 'express';
import skuLocalizationService from '../services/sku-localization.service.js';

class SKULocalizationController {
  // POST /api/admin/skus/:skuId/localizations - Create localization
  async createLocalization(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = req.params;
      const localization = await skuLocalizationService.createLocalization(skuId, req.body);
      res.status(201).json({
        success: true,
        data: localization,
        message: 'Localization created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/skus/:skuId/localizations - Get all localizations for SKU
  async getLocalizations(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = req.params;
      const localizations = await skuLocalizationService.getLocalizationsBySKU(skuId);
      res.json({
        success: true,
        data: localizations,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/impact?code=XXX&locale=YYY - Get SKU for specific market
  async getSKUForMarket(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const locale = (req.query.locale as string) || 'en-US';

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'SKU code is required',
        });
      }

      const sku = await skuLocalizationService.getSKUForMarket(code, locale);
      res.json({
        success: true,
        data: sku,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/localizations/:id - Update localization
  async updateLocalization(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const localization = await skuLocalizationService.updateLocalization(id, req.body);
      res.json({
        success: true,
        data: localization,
        message: 'Localization updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/localizations/:id - Delete localization
  async deleteLocalization(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const localization = await skuLocalizationService.deleteLocalization(id);
      res.json({
        success: true,
        data: localization,
        message: 'Localization deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/locales - Get all available locales
  async getAvailableLocales(req: Request, res: Response, next: NextFunction) {
    try {
      const locales = await skuLocalizationService.getAvailableLocales();
      res.json({
        success: true,
        data: locales,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/skus/:skuId/localizations/bulk - Bulk create localizations
  async bulkCreateLocalizations(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuId } = req.params;
      const { localizations } = req.body;

      if (!Array.isArray(localizations) || localizations.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'localizations array is required',
        });
      }

      const created = await skuLocalizationService.bulkCreateLocalizations(skuId, localizations);
      res.status(201).json({
        success: true,
        data: created,
        message: `${created.length} localizations created successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SKULocalizationController();
