// Payment Controller - Stripe payment handling
import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service.js';

class PaymentController {
  // POST /api/payments/create-intent - Create payment intent
  async createIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, transactionId, merchantStripeAccountId } = req.body;

      const paymentIntent = await paymentService.createPaymentIntent({
        amount,
        transactionId,
        merchantStripeAccountId,
      });

      res.json({
        success: true,
        data: paymentIntent,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/webhook - Stripe webhook handler
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing stripe-signature header',
        });
      }

      // Raw body is required for webhook signature verification
      const result = await paymentService.handleWebhook(req.body, signature);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/:paymentIntentId - Get payment intent status
  async getPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentIntent = await paymentService.getPaymentIntent(req.params.paymentIntentId);
      res.json({
        success: true,
        data: paymentIntent,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
