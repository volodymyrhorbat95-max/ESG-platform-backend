// Payment Service - Stripe Connect integration for split payments
// CRITICAL: Platform fee percentage comes from GlobalConfig (configurable)
// Stripe Connect Flow (Section 7.2 & 20.5):
// 1. Merchant onboards via OAuth link → Creates connected account
// 2. Customer pays → Stripe splits payment immediately
// 3. CSR26 receives plastic fee, merchant receives rest
// Example: Customer pays €101 (€100 product + €1 plastic)
//          Stripe splits: €100 to merchant, €1 to CSR26
import Stripe from 'stripe';
import { env } from '../config/env.js';
import transactionService from './transaction.service.js';
import configService from './config.service.js';
import { PaymentStatus, Merchant } from '../database/models/index.js';
import { StripeAccountStatus } from '../database/models/Merchant.js';

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

// Stripe Connect account creation response
interface ConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

// Stripe Connect account status
interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  status: StripeAccountStatus;
}

// E-commerce split payment data
interface CreateEcommerceSplitPaymentData {
  totalAmount: number; // Total order amount in euros (product + plastic fee)
  plasticFee: number; // The plastic removal fee portion
  merchantStripeAccountId: string; // Connected account ID
  orderId: string; // E-commerce order reference
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

class PaymentService {
  // ==========================================
  // STRIPE CONNECT ACCOUNT MANAGEMENT
  // ==========================================

  /**
   * Create a Stripe Connect Express account for a merchant
   * Express accounts are recommended for platforms - simpler onboarding
   * @param merchantId - Internal merchant ID for reference
   * @param email - Merchant email for the account
   * @param businessName - Merchant business name
   * @returns Account ID and onboarding URL
   */
  async createConnectAccount(
    merchantId: string,
    email: string,
    businessName: string
  ): Promise<ConnectAccountResult> {
    try {
      // Create Express connected account
      // Express is recommended for most platforms - handles compliance
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'company',
        company: {
          name: businessName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          merchantId, // Link to our internal merchant record
          platform: 'csr26',
        },
      });

      // Create account onboarding link
      // Merchant will complete identity verification, bank details, etc.
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${env.frontend.url}/merchant/stripe/refresh?merchantId=${merchantId}`,
        return_url: `${env.frontend.url}/merchant/stripe/complete?merchantId=${merchantId}`,
        type: 'account_onboarding',
      });

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error: any) {
      throw new Error(`Failed to create Stripe Connect account: ${error.message}`);
    }
  }

  /**
   * Generate a new onboarding link for an existing account
   * Used when merchant needs to continue or retry onboarding
   */
  async createOnboardingLink(
    stripeAccountId: string,
    merchantId: string
  ): Promise<string> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${env.frontend.url}/merchant/stripe/refresh?merchantId=${merchantId}`,
        return_url: `${env.frontend.url}/merchant/stripe/complete?merchantId=${merchantId}`,
        type: 'account_onboarding',
      });
      return accountLink.url;
    } catch (error: any) {
      throw new Error(`Failed to create onboarding link: ${error.message}`);
    }
  }

  /**
   * Generate a login link for the Stripe Express Dashboard
   * Allows merchant to view their payouts and settings
   */
  async createDashboardLink(stripeAccountId: string): Promise<string> {
    try {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      return loginLink.url;
    } catch (error: any) {
      throw new Error(`Failed to create dashboard link: ${error.message}`);
    }
  }

  /**
   * Get the current status of a Stripe Connect account
   * Called after onboarding or via webhook to update merchant record
   */
  async getAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatus> {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);

      // Determine account status based on Stripe's requirements
      let status: StripeAccountStatus = 'pending';
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'active';
      } else if (account.requirements?.disabled_reason) {
        status = 'disabled';
      } else if (account.requirements?.currently_due?.length) {
        status = 'restricted';
      }

      return {
        accountId: account.id,
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
        detailsSubmitted: account.details_submitted ?? false,
        status,
      };
    } catch (error: any) {
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  /**
   * Delete/deauthorize a Stripe Connect account
   * Called when merchant relationship ends
   */
  async deleteConnectAccount(stripeAccountId: string): Promise<void> {
    try {
      await stripe.accounts.del(stripeAccountId);
    } catch (error: any) {
      throw new Error(`Failed to delete Connect account: ${error.message}`);
    }
  }

  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================

  /**
   * Create payment intent (for PAY type transactions)
   * Supports split payments via Stripe Connect
   */
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
      // Uses destination charges - funds go to connected account minus application fee
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

  /**
   * Create a split payment for e-commerce integration (Section 20.5)
   * Flow: Customer pays €101 → €100 to merchant, €1 (plastic fee) to CSR26
   *
   * This uses destination charges where:
   * - Full amount is charged to customer
   * - Merchant receives (total - plasticFee) via transfer
   * - CSR26 (platform) keeps the plasticFee as application_fee
   */
  async createEcommerceSplitPayment(data: CreateEcommerceSplitPaymentData) {
    try {
      const totalAmountCents = Math.round(data.totalAmount * 100);
      const plasticFeeCents = Math.round(data.plasticFee * 100);
      const merchantAmountCents = totalAmountCents - plasticFeeCents;

      // Validate merchant can receive payments
      const accountStatus = await this.getAccountStatus(data.merchantStripeAccountId);
      if (!accountStatus.chargesEnabled) {
        throw new Error('Merchant Stripe account cannot accept charges');
      }

      // Create payment intent with destination charge
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'eur',
        // Destination charge: merchant receives amount minus application fee
        transfer_data: {
          destination: data.merchantStripeAccountId,
        },
        // Application fee = plastic fee goes to CSR26
        application_fee_amount: plasticFeeCents,
        // Receipt email for customer
        receipt_email: data.customerEmail,
        description: `CSR26 Plastic Neutral Order - ${data.orderId}`,
        metadata: {
          orderId: data.orderId,
          plasticFeeEuro: data.plasticFee.toFixed(2),
          merchantAmount: (merchantAmountCents / 100).toFixed(2),
          ...data.metadata,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        splitDetails: {
          totalAmount: data.totalAmount,
          merchantReceives: merchantAmountCents / 100,
          plasticFee: data.plasticFee,
        },
      };
    } catch (error: any) {
      throw new Error(`E-commerce split payment failed: ${error.message}`);
    }
  }

  /**
   * Create a direct transfer to a connected account
   * Used for manual payouts or adjustments
   */
  async createTransfer(
    amountEuro: number,
    stripeAccountId: string,
    description: string
  ) {
    try {
      const amountCents = Math.round(amountEuro * 100);
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'eur',
        destination: stripeAccountId,
        description,
      });
      return transfer;
    } catch (error: any) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  // ==========================================
  // WEBHOOK HANDLING
  // ==========================================

  /**
   * Handle Stripe webhook events
   * Processes both payment events and Connect account events
   */
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
        // Payment events
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        // Checkout Session events (Section 1.2: E-commerce split payments)
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'checkout.session.expired':
          console.log(`Checkout session expired: ${(event.data.object as Stripe.Checkout.Session).id}`);
          break;

        // Stripe Connect account events
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'account.application.deauthorized':
          // The deauthorized event has account ID in the application object
          const application = event.data.object as { account?: string };
          if (application.account) {
            await this.handleAccountDeauthorizedById(application.account);
          }
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

    console.log(`Payment succeeded for transaction ${transactionId}`);
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

    console.log(`Payment failed for transaction ${transactionId}`);
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

    console.log(`Payment canceled for transaction ${transactionId}`);
  }

  /**
   * Handle checkout.session.completed webhook
   * Section 1.2: E-commerce split payments
   * This is called when a customer completes payment via Stripe Checkout
   * Auto-creates transaction and user if not already done
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    // Only process if payment was successful
    if (session.payment_status !== 'paid') {
      console.log(`Checkout session ${session.id} not paid yet, skipping`);
      return;
    }

    const metadata = session.metadata;
    if (!metadata?.merchantId || !metadata?.orderId) {
      console.log(`Checkout session ${session.id} missing required metadata (merchantId, orderId)`);
      return;
    }

    try {
      // Import checkout service dynamically to avoid circular dependency
      const checkoutService = (await import('./checkout.service.js')).default;

      // Complete the checkout - this creates user, transaction, and impact URL
      const result = await checkoutService.completeCheckout({
        merchantId: metadata.merchantId,
        checkoutSessionId: session.id,
        orderId: metadata.orderId,
      });

      console.log(`✅ Checkout session ${session.id} completed - Transaction: ${result.transactionId}, Impact: ${result.impactKg}kg`);
    } catch (error: any) {
      // If already completed (duplicate webhook), log and continue
      if (error.message?.includes('already')) {
        console.log(`Checkout session ${session.id} already processed`);
        return;
      }
      console.error(`Failed to complete checkout session ${session.id}: ${error.message}`);
    }
  }

  /**
   * Handle Stripe Connect account.updated webhook
   * Updates merchant's Stripe status in our database
   */
  private async handleAccountUpdated(account: Stripe.Account) {
    const merchantId = account.metadata?.merchantId;
    if (!merchantId) {
      console.log(`Account ${account.id} updated but no merchantId in metadata`);
      return;
    }

    try {
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        console.error(`Merchant ${merchantId} not found for account ${account.id}`);
        return;
      }

      // Determine account status
      let status: StripeAccountStatus = 'pending';
      if (account.charges_enabled && account.payouts_enabled) {
        status = 'active';
      } else if (account.requirements?.disabled_reason) {
        status = 'disabled';
      } else if (account.requirements?.currently_due?.length) {
        status = 'restricted';
      }

      // Update merchant record
      await merchant.update({
        stripeAccountStatus: status,
        stripeChargesEnabled: account.charges_enabled ?? false,
        stripePayoutsEnabled: account.payouts_enabled ?? false,
        stripeOnboardingComplete: account.details_submitted ?? false,
      });

      console.log(`Updated merchant ${merchantId} Stripe status: ${status}`);
    } catch (error: any) {
      console.error(`Failed to update merchant from webhook: ${error.message}`);
    }
  }

  /**
   * Handle account.application.deauthorized webhook
   * Merchant has disconnected from the platform
   * Uses account ID to find and update the merchant
   */
  private async handleAccountDeauthorizedById(stripeAccountId: string) {
    try {
      // Find merchant by Stripe account ID
      const merchant = await Merchant.findOne({
        where: { stripeAccountId },
      });

      if (!merchant) {
        console.log(`No merchant found for Stripe account ${stripeAccountId}`);
        return;
      }

      // Clear Stripe connection
      await merchant.update({
        stripeAccountId: undefined,
        stripeAccountStatus: undefined,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeOnboardingComplete: false,
      });

      console.log(`Merchant ${merchant.id} disconnected from Stripe`);
    } catch (error: any) {
      console.error(`Failed to handle deauthorization: ${error.message}`);
    }
  }

  // Get payment intent status
  async getPaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // Export stripe instance for advanced usage
  getStripe() {
    return stripe;
  }
}

export default new PaymentService();
