// Export Routes
import { Router } from 'express';
import exportController from '../controllers/export.controller.js';

const router = Router();

// GET /api/admin/export - Export data (Excel/CSV) with filters (Step 12 requirement)
router.get('/admin/export', exportController.exportAmplivo);

// GET /api/admin/export/partner/:partnerId - Export partner report
router.get('/admin/export/partner/:partnerId', exportController.exportPartnerReport);

export default router;
