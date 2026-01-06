import { Router } from 'express';
import partnerController from '../controllers/partner.controller.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Admin partner management routes (protected)
router.post(
  '/',
  requireAdmin,
  validateRequiredFields(['name', 'email', 'contactPerson']),
  partnerController.create
);
router.get('/', requireAdmin, partnerController.getAll);
router.get('/:id', requireAdmin, partnerController.getById);
router.put('/:id', requireAdmin, partnerController.update);
router.delete('/:id', requireAdmin, partnerController.deactivate);

export default router;
