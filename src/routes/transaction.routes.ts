import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Transaction routes
router.post('/', transactionController.create); // Public - for customer transactions
router.post('/manual', requireAdmin, transactionController.createManual); // Section 9.5: Admin only - manual transaction creation
router.get('/', requireAdmin, transactionController.getAll); // Admin only - view all transactions
router.get('/user/:userId', transactionController.getByUserId); // User dashboard transactions
router.get('/user/:userId/total-impact', transactionController.getUserTotalImpact); // User total impact
router.get('/merchant/:merchantId', transactionController.getByMerchantId); // Merchant dashboard transactions
router.get('/:id', transactionController.getById); // Public - view single transaction (customer dashboard)
router.put('/:id/payment-status', transactionController.updatePaymentStatus); // Webhook/internal use

export default router;
