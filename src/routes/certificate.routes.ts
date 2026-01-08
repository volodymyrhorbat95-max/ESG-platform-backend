import { Router } from 'express';
import certificateController from '../controllers/certificate.controller.js';

const router = Router();

// Certificate endpoints (public - can be accessed with transaction ID)
// Section 9: Certificate Generation
// - Download: GET /api/certificates/:transactionId
// - Preview: GET /api/certificates/:transactionId/preview
// - Verify: GET /api/certificates/:transactionId/verify (for QR code scanning)
router.get('/certificates/:transactionId', certificateController.downloadCertificate);
router.get('/certificates/:transactionId/preview', certificateController.previewCertificate);
router.get('/certificates/:transactionId/verify', certificateController.verifyCertificate);

export default router;
