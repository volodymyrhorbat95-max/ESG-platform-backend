import { Router } from 'express';
import giftCardController from '../controllers/giftCard.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// POST /api/validate-code - Validate gift card code (Step 10 requirement)
router.post('/validate-code', giftCardController.validate);

// Admin gift card management routes (protected)
router.post('/gift-cards/bulk', requireAdmin, giftCardController.createBulk);
router.get('/gift-cards', requireAdmin, giftCardController.getAll);
router.get('/gift-cards/:code', requireAdmin, giftCardController.getByCode);
router.get('/gift-cards/sku/:skuId', requireAdmin, giftCardController.getBySKU);

export default router;
