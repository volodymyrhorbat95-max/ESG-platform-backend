import { Router } from 'express';
import merchantController from '../controllers/merchant.controller.js';
import merchantExportController from '../controllers/merchant-export.controller.js';
import { validateRequiredFields } from '../middleware/validation.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// ==========================================
// ADMIN MERCHANT MANAGEMENT (Protected)
// ==========================================

router.post(
  '/admin/merchants',
  requireAdmin,
  validateRequiredFields(['name', 'email']),
  merchantController.create
);
router.get('/admin/merchants', requireAdmin, merchantController.getAll);
router.put('/admin/merchants/:id', requireAdmin, merchantController.update);
router.delete('/admin/merchants/:id', requireAdmin, merchantController.delete);

// ==========================================
// STRIPE CONNECT MANAGEMENT (Admin only)
// Priority 4: Stripe Connect Integration
// ==========================================

// Get all merchants with Stripe status overview
router.get('/admin/merchants/stripe-status', requireAdmin, merchantController.getAllWithStripeStatus);

// Start Stripe Connect onboarding for a merchant
router.post('/admin/merchants/:id/stripe/onboard', requireAdmin, merchantController.startStripeOnboarding);

// Get fresh onboarding link (if previous expired)
router.get('/admin/merchants/:id/stripe/onboarding-link', requireAdmin, merchantController.refreshOnboardingLink);

// Get Stripe Express Dashboard login link
router.get('/admin/merchants/:id/stripe/dashboard', requireAdmin, merchantController.getStripeDashboard);

// Sync merchant's Stripe status
router.post('/admin/merchants/:id/stripe/sync', requireAdmin, merchantController.syncStripeStatus);

// Manually set Stripe account ID (for existing accounts)
router.put('/admin/merchants/:id/stripe/account-id', requireAdmin, merchantController.setStripeAccountId);

// Disconnect merchant from Stripe
router.delete('/admin/merchants/:id/stripe', requireAdmin, merchantController.disconnectStripe);

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Public route for payment flow - Get merchant by ID
router.get('/merchants/:id', merchantController.getById);

// Merchant ESG report export
router.get('/merchants/:merchantId/export/esg', merchantExportController.exportESGReport);

export default router;
