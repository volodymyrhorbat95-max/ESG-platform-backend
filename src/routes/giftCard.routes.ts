import { Router } from 'express';
import giftCardController from '../controllers/giftCard.controller.js';

const router = Router();

// POST /api/validate-code - Validate gift card code (Step 10 requirement)
router.post('/validate-code', giftCardController.validate);

// Admin gift card management routes
router.post('/gift-cards/bulk', giftCardController.createBulk);
router.get('/gift-cards', giftCardController.getAll);
router.get('/gift-cards/:code', giftCardController.getByCode);
router.get('/gift-cards/sku/:skuId', giftCardController.getBySKU);

export default router;
