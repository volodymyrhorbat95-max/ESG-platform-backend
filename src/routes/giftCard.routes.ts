import { Router } from 'express';
import giftCardController from '../controllers/giftCard.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// POST /api/validate-code - Validate gift card code (Step 10 requirement)
router.post('/validate-code', giftCardController.validate);

// Admin gift card management routes (protected)
router.post('/gift-cards/generate', requireAdmin, giftCardController.generateBulk);
router.post('/gift-cards/bulk', requireAdmin, giftCardController.createBulk);
router.get('/gift-cards', requireAdmin, giftCardController.getAll);
router.get('/gift-cards/sku/:skuId', requireAdmin, giftCardController.getBySKU);

// Invalidation routes (admin only) - placed before :code param route to avoid conflicts
router.post('/gift-cards/invalidate-bulk', requireAdmin, giftCardController.invalidateBulk);
router.delete('/gift-cards/:code', requireAdmin, giftCardController.invalidate);

// Get single code by code - placed last due to :code param
router.get('/gift-cards/:code', requireAdmin, giftCardController.getByCode);

export default router;
