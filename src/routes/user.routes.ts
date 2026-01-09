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

// Registration endpoints - Support 3 levels: minimal, standard, full
// Frontend calls: /api/users/register, /api/users/register/minimal, etc.

// POST /api/users/register/minimal - Email only (for CLAIM type SKUs)
router.post(
  '/users/register/minimal',
  validateRequiredFields(['email']),
  validateEmail,
  userController.registerMinimal
);

// POST /api/users/register/standard - Email + Name (for small transactions)
router.post(
  '/users/register/standard',
  validateRequiredFields(['email', 'firstName', 'lastName']),
  validateEmail,
  userController.registerStandard
);

// POST /api/users/register/full - All fields (for 10+ euro transactions)
router.post(
  '/users/register/full',
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
  userController.registerFull
);

// POST /api/users/register - Generic registration (auto-determines level)
router.post(
  '/users/register',
  validateRequiredFields(['email']),
  validateEmail,
  userController.register
);

// Admin user management routes - PROTECTED with requireAdmin middleware
router.get('/users', requireAdmin, userController.getAll);
router.get('/users/email/:email', requireAdmin, userController.getByEmail);

// User profile management routes - Users access their own profile by ID
// Note: GET /users/:id is placed AFTER /users/email/:email to avoid route conflict
router.get('/users/:id', userController.getById);
router.put('/users/:id/self', userController.updateSelf); // User self-update (no auth required)
router.put('/users/:id', requireAdmin, userController.update); // Admin only - edit user profile
router.delete('/users/:id', requireAdmin, userController.delete); // Admin only - delete user
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
