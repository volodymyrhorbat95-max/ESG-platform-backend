import { Router } from 'express';
import skuController from '../controllers/sku.controller.js';
import { validateRequiredFields, validatePaymentMode } from '../middleware/validation.js';

const router = Router();

// Admin SKU management routes
router.post(
  '/admin/skus',
  validateRequiredFields(['code', 'name', 'gramsWeight', 'price', 'paymentMode', 'requiresValidation']),
  validatePaymentMode,
  skuController.create
);
router.get('/admin/skus', skuController.getAll);
router.get('/admin/skus/:id', skuController.getById);
router.put('/admin/skus/:id', skuController.update);
router.delete('/admin/skus/:id', skuController.delete);

// Landing page endpoint - Get SKU impact data by code
router.get('/impact', skuController.getImpactByCode);

export default router;
