import { Router } from 'express';
import certificateController from '../controllers/certificate.controller.js';

const router = Router();

// Certificate endpoints (public - can be accessed with transaction ID)
router.get('/certificates/:transactionId', certificateController.downloadCertificate);
router.get('/certificates/:transactionId/preview', certificateController.previewCertificate);

export default router;
