// Webhook Controller - Handle e-commerce platform webhooks
// Section 20.4: WooCommerce/E-commerce Integration
import { Request, Response, NextFunction } from 'express';
import webhookService from '../services/webhook.service.js';
import { Merchant } from '../database/models/index.js';

class WebhookController {
  /**
   * POST /api/webhooks/ecommerce/:merchantId
   * Receive and process webhook from e-commerce platform
   *
   * CRITICAL: This endpoint must be registered BEFORE express.json()
   * to allow raw body access for signature verification
   */
  async handleEcommerceWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;

      // Find merchant and verify webhook configuration
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      if (!merchant.webhookSecret || !merchant.webhookPlatform) {
        return res.status(400).json({
          success: false,
          error: 'Webhook not configured for this merchant',
        });
      }

      // Get signature from headers (different platforms use different header names)
      let signature: string | undefined;
      if (merchant.webhookPlatform === 'WOOCOMMERCE') {
        signature = req.headers['x-wc-webhook-signature'] as string;
      } else if (merchant.webhookPlatform === 'SHOPIFY') {
        signature = req.headers['x-shopify-hmac-sha256'] as string;
      } else {
        // CUSTOM platform - use generic header
        signature = req.headers['x-webhook-signature'] as string;
      }

      if (!signature) {
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature',
        });
      }

      // Verify signature using raw body
      // req.body should be raw Buffer at this point (handled by middleware)
      const isValid = webhookService.verifySignature(
        req.body,
        signature,
        merchant.webhookSecret,
        merchant.webhookPlatform
      );

      if (!isValid) {
        console.error(`❌ Invalid webhook signature from merchant ${merchantId}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      // Parse JSON payload (now that signature is verified)
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(req.body.toString('utf8'));

      // Process webhook
      const result = await webhookService.processWebhook(
        merchantId,
        payload,
        merchant.webhookPlatform
      );

      console.log(`✅ Webhook processed successfully for merchant ${merchantId} - ${result.transactionIds.length} transactions created`);

      res.json({
        success: true,
        data: {
          transactionsCreated: result.transactionIds.length,
          transactionIds: result.transactionIds,
        },
      });
    } catch (error: any) {
      console.error('❌ Webhook processing error:', error);
      next(error);
    }
  }

  /**
   * POST /api/webhooks/test/:merchantId
   * Test webhook endpoint (development only)
   * Allows merchants to test their webhook integration without signature verification
   */
  async testWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Test webhook endpoint is only available in development mode',
        });
      }

      const { merchantId } = req.params;
      const payload = req.body;

      // Find merchant
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      if (!merchant.webhookPlatform) {
        return res.status(400).json({
          success: false,
          error: 'Webhook platform not configured for this merchant',
        });
      }

      // Process webhook WITHOUT signature verification (test mode)
      console.log(`🧪 Processing TEST webhook for merchant ${merchantId}`);

      const result = await webhookService.processWebhook(
        merchantId,
        payload,
        merchant.webhookPlatform
      );

      res.json({
        success: true,
        message: 'Test webhook processed successfully',
        data: {
          transactionsCreated: result.transactionIds.length,
          transactionIds: result.transactionIds,
          qrCodes: result.qrCodes,
        },
      });
    } catch (error: any) {
      console.error('❌ Test webhook error:', error);
      next(error);
    }
  }

  /**
   * GET /api/webhooks/config/:merchantId
   * Get webhook configuration for a merchant
   * Returns webhook URL and setup instructions
   */
  async getWebhookConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;

      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      const webhookUrl = webhookService.generateWebhookEndpointUrl(merchantId);

      res.json({
        success: true,
        data: {
          merchantId: merchant.id,
          merchantName: merchant.name,
          webhookUrl,
          webhookPlatform: merchant.webhookPlatform || 'Not configured',
          webhookConfigured: !!(merchant.webhookSecret && merchant.webhookPlatform),
          instructions: {
            woocommerce: {
              step1: 'Go to WooCommerce > Settings > Advanced > Webhooks',
              step2: `Click "Add webhook"`,
              step3: `Set Delivery URL to: ${webhookUrl}`,
              step4: 'Set Topic to: Order created',
              step5: 'Copy the Secret from your merchant dashboard and paste it here',
              step6: 'Set Status to Active',
              step7: 'Save webhook',
            },
            shopify: {
              step1: 'Go to Settings > Notifications',
              step2: 'Scroll to Webhooks section',
              step3: 'Click Create webhook',
              step4: `Set URL to: ${webhookUrl}`,
              step5: 'Set Event to: Order creation',
              step6: 'Copy the webhook secret from Shopify and configure in CSR26 dashboard',
              step7: 'Save webhook',
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WebhookController();
