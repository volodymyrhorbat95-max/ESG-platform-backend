// Checkout Routes - Merchant E-commerce Integration
// Section 1.2: Stripe Split Payment Flow
//
// These routes are for merchant integration with their e-commerce platforms.
// Authentication is done via merchantId validation (merchant must exist and be active).

import { Router, Request, Response, NextFunction } from 'express';
import checkoutController from '../controllers/checkout.controller.js';
import { Merchant } from '../database/models/index.js';

const router = Router();

/**
 * Middleware to validate merchant exists and is active
 * All checkout endpoints require a valid merchantId
 */
const validateMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.body.merchantId || req.query.merchantId;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        error: 'merchantId is required',
      });
    }

    const merchant = await Merchant.findByPk(merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
      });
    }

    if (!merchant.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Merchant account is inactive',
      });
    }

    // Attach merchant to request for use in controllers
    (req as any).merchant = merchant;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional: API Key authentication for production
 * Merchants can use their webhookSecret as an API key
 */
const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const merchantId = req.body.merchantId || req.query.merchantId;

    if (!apiKey) {
      // If no API key, just validate merchant exists (for development)
      return next();
    }

    const merchant = await Merchant.findByPk(merchantId);

    if (!merchant || merchant.webhookSecret !== apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHECKOUT ENDPOINTS
// ==========================================

/**
 * POST /api/checkout/calculate-fee
 * Calculate plastic fee for cart items
 * Used by merchant during checkout to show plastic fee before payment
 */
router.post('/calculate-fee', validateMerchant, checkoutController.calculateFee);

/**
 * POST /api/checkout/create-session
 * Create Stripe Checkout Session with split payment
 * Customer is redirected to Stripe to complete payment
 */
router.post('/create-session', validateMerchant, validateApiKey, checkoutController.createSession);

/**
 * POST /api/checkout/complete
 * Complete checkout after successful payment
 * Returns impact URL for customer's thank you page (Point B)
 */
router.post('/complete', validateMerchant, validateApiKey, checkoutController.completeCheckout);

/**
 * GET /api/checkout/status/:sessionId
 * Get checkout session status
 * Merchant can poll this to check if payment completed
 */
router.get('/status/:sessionId', checkoutController.getStatus);

/**
 * POST /api/checkout/create-payment-intent
 * Create payment intent for direct Stripe.js integration
 * Alternative to Checkout Session for custom payment forms
 */
router.post('/create-payment-intent', validateMerchant, validateApiKey, checkoutController.createPaymentIntent);

export default router;
