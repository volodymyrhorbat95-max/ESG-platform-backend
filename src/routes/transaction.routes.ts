import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';
import transactionTokenController from '../controllers/transactionToken.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { tokenValidationRateLimiter } from '../middleware/security.js';

const router = Router();

// Transaction routes
router.post('/', transactionController.create); // Public - for customer transactions
router.post('/manual', requireAdmin, transactionController.createManual); // Section 9.5: Admin only - manual transaction creation
router.get('/', requireAdmin, transactionController.getAll); // Admin only - view all transactions
router.get('/user/:userId', transactionController.getByUserId); // User dashboard transactions
router.get('/user/:userId/total-impact', transactionController.getUserTotalImpact); // User total impact
router.get('/merchant/:merchantId', transactionController.getByMerchantId); // Merchant dashboard transactions

// Section 20.4: E-commerce token-based access (PUBLIC - token IS the auth)
// Used by e-commerce landing page: /landing?txn={transactionId}&token={token}
// Rate limited to prevent token enumeration attacks
router.get('/token/:transactionId/:token', tokenValidationRateLimiter, transactionTokenController.getTransactionByToken);

// Token generation (admin/webhook use)
router.post('/:transactionId/generate-token', requireAdmin, transactionTokenController.generateToken);

router.get('/:id', transactionController.getById); // Public - view single transaction (customer dashboard)
router.put('/:id/payment-status', transactionController.updatePaymentStatus); // Webhook/internal use

export default router;
