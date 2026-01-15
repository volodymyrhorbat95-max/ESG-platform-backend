import { Router } from 'express';
import webhookController from '../controllers/webhook.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// NOTE: The main webhook endpoint /api/webhooks/ecommerce/:merchantId is registered
// directly in server.ts BEFORE express.json() middleware to preserve raw body
// for signature verification (similar to Stripe webhook)

// Get webhook configuration for a merchant (admin or merchant themselves)
router.get('/config/:merchantId', webhookController.getWebhookConfig);

// Test webhook endpoint (development only - no signature verification)
router.post('/test/:merchantId', webhookController.testWebhook);

export default router;
