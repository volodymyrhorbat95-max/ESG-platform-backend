import { Router } from 'express';
import merchantController from '../controllers/merchant.controller.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Admin merchant management routes (protected)
router.post(
  '/admin/merchants',
  requireAdmin,
  validateRequiredFields(['name', 'email']),
  merchantController.create
);
router.get('/admin/merchants', requireAdmin, merchantController.getAll);
router.put('/admin/merchants/:id', requireAdmin, merchantController.update);
router.delete('/admin/merchants/:id', requireAdmin, merchantController.delete);

// Public route for payment flow - Get merchant by ID
router.get('/merchants/:id', merchantController.getById);

export default router;
