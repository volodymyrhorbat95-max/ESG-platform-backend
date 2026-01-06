import { Router } from 'express';
import express from 'express';
import paymentController from '../controllers/payment.controller.js';

const router = Router();

// Payment routes
router.post('/create-intent', paymentController.createIntent);

// Webhook route - IMPORTANT: Must use raw body for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.webhook
);

router.get('/:paymentIntentId', paymentController.getPaymentIntent);

export default router;
