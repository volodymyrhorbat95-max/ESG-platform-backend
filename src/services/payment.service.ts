// Payment Service - Stripe integration for split payments
// CRITICAL: Platform fee percentage comes from GlobalConfig (configurable)
import Stripe from 'stripe';
import { env } from '../config/env.js';
import transactionService from './transaction.service.js';
import configService from './config.service.js';
import { PaymentStatus } from '../database/models/index.js';

// Initialize Stripe with secret key from environment
const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

interface CreatePaymentIntentData {
  amount: number; // Amount in euros
  transactionId: string;
  userId: string;
  skuId: string;
  partnerId?: string;
  merchantStripeAccountId?: string; // For split payments
}

class PaymentService {
  // Create payment intent (for PAY type transactions)
  async createPaymentIntent(data: CreatePaymentIntentData) {
    try {
      const amountInCents = Math.round(data.amount * 100); // Convert euros to cents

      // Get platform fee percentage from GlobalConfig (configurable, default 10%)
      const platformFeePercentage = await configService.getPlatformFeePercentage();
      const platformFeeAmount = Math.round(amountInCents * platformFeePercentage);

      // Payment intent configuration with required metadata (userId, skuId, partnerId)
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: 'eur',
        metadata: {
          transactionId: data.transactionId,
          userId: data.userId,
          skuId: data.skuId,
          ...(data.partnerId && { partnerId: data.partnerId }),
        },
        description: `CSR26 Plastic Neutral Transaction - ${data.transactionId}`,
      };

      // Add split payment if merchant account provided
      if (data.merchantStripeAccountId) {
        paymentIntentData.transfer_data = {
          destination: data.merchantStripeAccountId,
        };
        paymentIntentData.application_fee_amount = platformFeeAmount;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  // Handle Stripe webhook events
  async handleWebhook(payload: string | Buffer, signature: string) {
    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.stripe.webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error: any) {
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  // Handle successful payment
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.metadata.transactionId;
    if (!transactionId) {
      console.error('No transaction ID in payment intent metadata');
      return;
    }

    await transactionService.updatePaymentStatus(
      transactionId,
      PaymentStatus.COMPLETED,
      paymentIntent.id
    );

    console.log(`✅ Payment succeeded for transaction ${transactionId}`);
  }

  // Handle failed payment
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.metadata.transactionId;
    if (!transactionId) {
      console.error('No transaction ID in payment intent metadata');
      return;
    }

    await transactionService.updatePaymentStatus(
      transactionId,
      PaymentStatus.FAILED,
      paymentIntent.id
    );

    console.log(`❌ Payment failed for transaction ${transactionId}`);
  }

  // Handle canceled payment
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.metadata.transactionId;
    if (!transactionId) {
      console.error('No transaction ID in payment intent metadata');
      return;
    }

    await transactionService.updatePaymentStatus(
      transactionId,
      PaymentStatus.FAILED,
      paymentIntent.id
    );

    console.log(`🚫 Payment canceled for transaction ${transactionId}`);
  }

  // Get payment intent status
  async getPaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

export default new PaymentService();
