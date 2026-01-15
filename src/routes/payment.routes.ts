import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';

const router = Router();

// Payment routes
router.post('/create-intent', paymentController.createIntent);

// NOTE: Webhook route is registered directly in server.ts BEFORE express.json()
// This is critical for Stripe webhook signature verification which requires raw body
// The route /api/payments/webhook is handled there, not here

router.get('/:paymentIntentId', paymentController.getPaymentIntent);

export default router;
