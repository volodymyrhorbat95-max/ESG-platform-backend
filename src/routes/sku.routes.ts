import { Router } from 'express';
import skuController from '../controllers/sku.controller.js';
import skuLocalizationController from '../controllers/sku-localization.controller.js';
import { validateRequiredFields, validatePaymentMode } from '../middleware/validation.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Admin SKU management routes (protected)
router.post(
  '/admin/skus',
  requireAdmin,
  validateRequiredFields(['code', 'name', 'gramsWeight', 'price', 'paymentMode', 'requiresValidation']),
  validatePaymentMode,
  skuController.create
);
router.get('/admin/skus', requireAdmin, skuController.getAll);
router.get('/admin/skus/:id', requireAdmin, skuController.getById);
router.put('/admin/skus/:id', requireAdmin, skuController.update);
router.delete('/admin/skus/:id', requireAdmin, skuController.delete);

// SKU Localization routes (protected) - for multi-market support
router.post('/admin/skus/:skuId/localizations', requireAdmin, skuLocalizationController.createLocalization);
router.get('/admin/skus/:skuId/localizations', requireAdmin, skuLocalizationController.getLocalizations);
router.post('/admin/skus/:skuId/localizations/bulk', requireAdmin, skuLocalizationController.bulkCreateLocalizations);
router.put('/admin/localizations/:id', requireAdmin, skuLocalizationController.updateLocalization);
router.delete('/admin/localizations/:id', requireAdmin, skuLocalizationController.deleteLocalization);
router.get('/admin/locales', requireAdmin, skuLocalizationController.getAvailableLocales);

// Landing page endpoint - Get SKU impact data by code (with optional locale for market-specific data)
router.get('/impact', skuLocalizationController.getSKUForMarket);

export default router;
