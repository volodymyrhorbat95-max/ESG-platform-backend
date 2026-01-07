import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import shareableLinkController from '../controllers/shareable-link.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import {
  validateRequiredFields,
  validateEmail,
  validateDate,
  validateTermsAcceptance,
} from '../middleware/validation.js';

const router = Router();

// Registration endpoint - POST /api/register
// Note: 'state' is optional to support MinimalRegistrationForm for CLAIM type SKUs
router.post(
  '/register',
  validateRequiredFields([
    'firstName',
    'lastName',
    'email',
    'dateOfBirth',
    'street',
    'city',
    'postalCode',
    'country',
    'termsAccepted',
  ]),
  validateEmail,
  validateDate('dateOfBirth'),
  validateTermsAcceptance,
  userController.register
);

// Admin user management routes - PROTECTED with requireAdmin middleware
router.get('/users', requireAdmin, userController.getAll);
router.get('/users/:id', requireAdmin, userController.getById);
router.get('/users/email/:email', requireAdmin, userController.getByEmail);

// User profile management routes - Public (users can manage their own profile)
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);
router.get('/users/:id/export', userController.exportData);

// Shareable link routes - for customer engagement
router.post('/users/:userId/share', shareableLinkController.createLink);
router.get('/users/:userId/share', shareableLinkController.getUserLinks);
router.put('/users/:userId/share/:linkId', shareableLinkController.updateLink);
router.delete('/users/:userId/share/:linkId', shareableLinkController.deleteLink);
router.delete('/users/:userId/share', shareableLinkController.revokeAllLinks);

// Public shared dashboard endpoint (no auth required)
router.get('/share/:token', shareableLinkController.getSharedDashboard);

export default router;
