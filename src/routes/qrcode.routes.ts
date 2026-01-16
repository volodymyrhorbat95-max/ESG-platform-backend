import { Router } from 'express';
import qrcodeController from '../controllers/qrcode.controller.js';
import { validateRequiredFields } from '../middleware/validation.js';

const router = Router();

// Section 15: QR Code Generation Routes

// Generate single QR code for merchant + SKU
// POST /api/merchants/:merchantId/qrcodes
// Body: { skuCode, partnerId?, amount?, format?, includeLogo? }
router.post(
  '/merchants/:merchantId/qrcodes',
  validateRequiredFields(['skuCode']),
  qrcodeController.generateSingleQRCode
);

// Generate bulk QR codes for merchant
// POST /api/merchants/:merchantId/qrcodes/bulk
// Body: { skuCodes[], partnerId?, format?, includeLogo? }
router.post(
  '/merchants/:merchantId/qrcodes/bulk',
  validateRequiredFields(['skuCodes']),
  qrcodeController.generateBulkQRCodes
);

// Section 15.2: General QR code generation (marketing materials, no merchant required)
// POST /api/qrcodes
// Body: { skuCode, partnerId?, merchantId?, amount?, format?, includeLogo? }
router.post(
  '/qrcodes',
  validateRequiredFields(['skuCode']),
  qrcodeController.generateGeneralQRCode
);

export default router;
