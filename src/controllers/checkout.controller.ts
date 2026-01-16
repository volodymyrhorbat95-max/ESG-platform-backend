// Checkout Controller - Merchant E-commerce Integration Endpoints
// Section 1.2: Stripe Split Payment Flow
//
// These endpoints allow merchants to integrate plastic-neutral checkout
// into their e-commerce platforms.
//
// Authentication: Merchants authenticate using their merchantId + webhookSecret
// This provides a simple API key-like auth without requiring OAuth.

import { Request, Response, NextFunction } from 'express';
import checkoutService from '../services/checkout.service.js';
import { Merchant } from '../database/models/index.js';

class CheckoutController {
  /**
   * POST /api/checkout/calculate-fee
   * Calculate plastic fee for cart items
   *
   * Request body:
   * {
   *   "merchantId": "uuid",
   *   "items": [
   *     { "sku": "PRODUCT-001", "quantity": 2, "price": 25.00 }
   *   ]
   * }
   *
   * Response:
   * {
   *   "plasticFeeEur": 0.50,
   *   "plasticFeePerItem": [...],
   *   "totalImpactGrams": 4545,
   *   "csrPricePerKg": 0.11
   * }
   */
  async calculateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId, items } = req.body;

      if (!merchantId || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'merchantId and items array are required',
        });
      }

      const result = await checkoutService.calculatePlasticFee({ merchantId, items });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/checkout/create-session
   * Create Stripe Checkout Session with split payment
   *
   * Request body:
   * {
   *   "merchantId": "uuid",
   *   "orderId": "ORDER-12345",
   *   "customer": {
   *     "email": "customer@example.com",
   *     "firstName": "John",
   *     "lastName": "Doe"
   *   },
   *   "items": [
   *     { "sku": "PRODUCT-001", "name": "Product Name", "quantity": 2, "priceEur": 25.00 }
   *   ],
   *   "plasticFeeEur": 0.50,
   *   "successUrl": "https://merchant.com/checkout/success",
   *   "cancelUrl": "https://merchant.com/checkout/cancel",
   *   "partnerId": "optional-partner-id"
   * }
   *
   * Response:
   * {
   *   "checkoutSessionId": "cs_xxx",
   *   "checkoutUrl": "https://checkout.stripe.com/...",
   *   "expiresAt": "2026-01-15T12:30:00Z",
   *   "splitDetails": {
   *     "totalAmount": 50.50,
   *     "merchantReceives": 50.00,
   *     "plasticFee": 0.50
   *   }
   * }
   */
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        merchantId,
        orderId,
        customer,
        items,
        plasticFeeEur,
        successUrl,
        cancelUrl,
        partnerId,
        metadata,
      } = req.body;

      // Validate required fields
      if (!merchantId || !orderId || !customer || !items || plasticFeeEur === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: merchantId, orderId, customer, items, plasticFeeEur',
        });
      }

      if (!customer.email || !customer.firstName || !customer.lastName) {
        return res.status(400).json({
          success: false,
          error: 'Customer must include email, firstName, and lastName',
        });
      }

      if (!successUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          error: 'successUrl and cancelUrl are required',
        });
      }

      const result = await checkoutService.createCheckoutSession({
        merchantId,
        orderId,
        customer,
        items,
        plasticFeeEur,
        successUrl,
        cancelUrl,
        partnerId,
        metadata,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/checkout/complete
   * Complete checkout after successful payment
   * Returns impact URL for Point B (thank you page)
   *
   * Request body:
   * {
   *   "merchantId": "uuid",
   *   "checkoutSessionId": "cs_xxx",
   *   "orderId": "ORDER-12345"
   * }
   *
   * Response:
   * {
   *   "transactionId": "uuid",
   *   "impactGrams": 4545,
   *   "impactKg": 4.55,
   *   "impactUrl": "https://csr26.it/landing?txn=xxx&token=yyy",
   *   "customer": { "firstName": "John", "email": "customer@example.com" }
   * }
   */
  async completeCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId, checkoutSessionId, orderId } = req.body;

      if (!merchantId || !checkoutSessionId || !orderId) {
        return res.status(400).json({
          success: false,
          error: 'merchantId, checkoutSessionId, and orderId are required',
        });
      }

      const result = await checkoutService.completeCheckout({
        merchantId,
        checkoutSessionId,
        orderId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/checkout/status/:sessionId
   * Get checkout session status
   *
   * Response:
   * {
   *   "sessionId": "cs_xxx",
   *   "paymentStatus": "paid",
   *   "status": "complete",
   *   "amountTotal": 50.50
   * }
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required',
        });
      }

      const result = await checkoutService.getCheckoutStatus(sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/checkout/create-payment-intent
   * Create payment intent for direct Stripe.js integration
   * Alternative to Checkout Session for merchants who handle their own UI
   *
   * Request body:
   * {
   *   "merchantId": "uuid",
   *   "orderId": "ORDER-12345",
   *   "totalAmountEur": 50.50,
   *   "plasticFeeEur": 0.50,
   *   "customerEmail": "customer@example.com",
   *   "partnerId": "optional"
   * }
   *
   * Response:
   * {
   *   "paymentIntentId": "pi_xxx",
   *   "clientSecret": "pi_xxx_secret_yyy",
   *   "splitDetails": {...}
   * }
   */
  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        merchantId,
        orderId,
        totalAmountEur,
        plasticFeeEur,
        customerEmail,
        partnerId,
        metadata,
      } = req.body;

      if (!merchantId || !orderId || !totalAmountEur || plasticFeeEur === undefined || !customerEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: merchantId, orderId, totalAmountEur, plasticFeeEur, customerEmail',
        });
      }

      const result = await checkoutService.createPaymentIntent({
        merchantId,
        orderId,
        totalAmountEur,
        plasticFeeEur,
        customerEmail,
        partnerId,
        metadata,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CheckoutController();
