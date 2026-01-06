import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// Transaction routes
router.post('/', transactionController.create); // Public - for customer transactions
router.get('/', requireAdmin, transactionController.getAll); // Admin only - view all transactions
router.get('/:id', transactionController.getById); // Public - view single transaction (customer dashboard)
router.put('/:id/payment-status', transactionController.updatePaymentStatus); // Webhook/internal use

export default router;
