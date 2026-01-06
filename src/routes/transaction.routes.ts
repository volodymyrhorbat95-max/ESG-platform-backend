import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';

const router = Router();

// Transaction routes
router.post('/', transactionController.create);
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.put('/:id/payment-status', transactionController.updatePaymentStatus);

export default router;
