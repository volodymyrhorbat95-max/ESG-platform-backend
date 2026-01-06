// Export Routes
import { Router } from 'express';
import exportController from '../controllers/export.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// GET /api/admin/export - Export data (Excel/CSV) with filters (Step 12 requirement - protected)
router.get('/admin/export', requireAdmin, exportController.exportAmplivo);

// GET /api/admin/export/partner/:partnerId - Export partner report (protected)
router.get('/admin/export/partner/:partnerId', requireAdmin, exportController.exportPartnerReport);

export default router;
