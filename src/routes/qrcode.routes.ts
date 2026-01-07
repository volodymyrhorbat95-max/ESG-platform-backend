import { Router } from 'express';
import qrcodeController from '../controllers/qrcode.controller.js';
import { validateRequiredFields } from '../middleware/validation.js';

const router = Router();

// Generate single QR code for merchant + SKU
router.post(
  '/merchants/:merchantId/qrcodes',
  validateRequiredFields(['skuCode']),
  qrcodeController.generateSingleQRCode
);

// Generate bulk QR codes
router.post(
  '/merchants/:merchantId/qrcodes/bulk',
  validateRequiredFields(['skuCodes']),
  qrcodeController.generateBulkQRCodes
);

export default router;
