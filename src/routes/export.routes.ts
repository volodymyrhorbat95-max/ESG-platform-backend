// Export Routes
import { Router } from 'express';
import exportController from '../controllers/export.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// GET /api/admin/export - Export data (Excel/CSV) with filters (Step 12 requirement - protected)
router.get('/admin/export', requireAdmin, exportController.exportCorsairConnect);

// GET /api/admin/export/partner/:partnerId - Export partner report (protected)
router.get('/admin/export/partner/:partnerId', requireAdmin, exportController.exportPartnerReport);

// GET /api/admin/export/reconciliation - Export Stripe reconciliation report (protected)
router.get('/admin/export/reconciliation', requireAdmin, exportController.exportStripeReconciliation);

// GET /api/admin/export/impact - Export aggregate impact report (protected)
router.get('/admin/export/impact', requireAdmin, exportController.exportImpactReport);

// GET /api/admin/export/trends - Export trend analysis report (monthly breakdown) (protected)
router.get('/admin/export/trends', requireAdmin, exportController.exportTrendAnalysis);

// GET /api/admin/export/sku-performance - Export per-SKU performance report (protected)
router.get('/admin/export/sku-performance', requireAdmin, exportController.exportSKUPerformance);

export default router;
