import { Router } from 'express';
import skuController from '../controllers/sku.controller.js';
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

// Landing page endpoint - Get SKU impact data by code
router.get('/impact', skuController.getImpactByCode);

export default router;
