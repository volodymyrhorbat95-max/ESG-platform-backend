// Checkout Service - Merchant E-commerce Integration for Split Payments
// Section 1.2: Stripe Split Payment Flow
//
// This service provides the API for merchants to integrate plastic-neutral checkout
// into their e-commerce platforms (WooCommerce, Shopify, custom).
//
// Flow (Per Client Requirements - Conversation lines 689-698):
// POINT A (Checkout):
//   1. Customer adds products to cart on merchant's site
//   2. Merchant's checkout calculates plastic fee based on SKUs
//   3. Merchant calls CSR26 API to create split payment
//   4. Customer pays total (product + plastic fee)
//   5. Stripe splits IMMEDIATELY: product amount to merchant, plastic fee to CSR26
//
// POINT B (Thank You Page):
//   1. After successful payment, merchant shows button/QR to customer
//   2. Customer clicks → CSR26 landing page with personalized impact
//   3. NO form filling needed - data captured from order

import Stripe from 'stripe';
import { env } from '../config/env.js';
import { Merchant, SKU, User, Transaction } from '../database/models/index.js';
import { PaymentMode } from '../database/models/SKU.js';
import configService from './config.service.js';
import transactionService from './transaction.service.js';
import transactionTokenService from './transactionToken.service.js';
import userService from './user.service.js';
import paymentService from './payment.service.js';

// Initialize Stripe
const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Request data for calculating plastic fee
interface CalculatePlasticFeeRequest {
  merchantId: string;
  items: Array<{
    sku: string;
    quantity: number;
    price: number; // Price per item in EUR
  }>;
}

// Response for plastic fee calculation
interface PlasticFeeResult {
  plasticFeeEur: number;
  plasticFeePerItem: Array<{
    sku: string;
    quantity: number;
    impactGrams: number;
    feeEur: number;
  }>;
  totalImpactGrams: number;
  csrPricePerKg: number;
}

// Request for creating checkout session with split payment
interface CreateCheckoutRequest {
  merchantId: string;
  orderId: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    state?: string;
  };
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    priceEur: number; // Price per item
  }>;
  plasticFeeEur: number; // Pre-calculated plastic fee
  successUrl: string; // Merchant's success URL (we'll append session_id)
  cancelUrl: string; // Merchant's cancel URL
  partnerId?: string;
  metadata?: Record<string, string>;
}

// Response from checkout creation
interface CheckoutResult {
  checkoutSessionId: string;
  checkoutUrl: string;
  expiresAt: Date;
  splitDetails: {
    totalAmount: number;
    merchantReceives: number;
    plasticFee: number;
    platformFeePercent: number;
  };
}

// Request for completing checkout (after Stripe payment succeeds)
interface CompleteCheckoutRequest {
  merchantId: string;
  checkoutSessionId: string;
  orderId: string;
}

// Response from checkout completion (Point B data)
interface CheckoutCompletionResult {
  success: boolean;
  transactionId: string;
  impactGrams: number;
  impactKg: number;
  impactUrl: string; // URL for customer to see their impact (Point B)
  qrCodeData?: string; // QR code for impact URL
  customer: {
    firstName: string;
    email: string;
  };
}

class CheckoutService {
  /**
   * Calculate plastic fee for cart items
   * Merchants call this during checkout to know how much plastic fee to add
   *
   * Uses formula: Impact (kg) = Amount / CURRENT_CSR_PRICE
   * Then: Plastic Fee = Impact (kg) * CURRENT_CSR_PRICE
   *
   * For SKUs with weight-based pricing (like CLAIM products):
   * Plastic Fee = (productWeight * impactMultiplier / 1000) * CURRENT_CSR_PRICE
   */
  async calculatePlasticFee(request: CalculatePlasticFeeRequest): Promise<PlasticFeeResult> {
    const merchant = await Merchant.findByPk(request.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const csrPrice = await configService.getCurrentCSRPrice();
    let totalFee = 0;
    let totalImpactGrams = 0;
    const itemResults: PlasticFeeResult['plasticFeePerItem'] = [];

    for (const item of request.items) {
      const sku = await SKU.findOne({ where: { code: item.sku } });

      let itemImpactGrams: number;
      let itemFee: number;

      if (sku) {
        // SKU found - use its weight and multiplier for CLAIM products
        if (sku.paymentMode === 'CLAIM') {
          // For CLAIM: fee based on product weight
          const productWeight = Number(sku.productWeight) || 0;
          const multiplier = Number(sku.impactMultiplier) || 1;
          itemImpactGrams = productWeight * multiplier * item.quantity;
          itemFee = (itemImpactGrams / 1000) * csrPrice;
        } else {
          // For PAY/ALLOCATION: fee is a percentage of item price
          // Use standard formula: amount / CSR_PRICE = kg
          const itemTotal = item.price * item.quantity;
          // Default: 1% of product price as plastic fee (configurable per merchant)
          itemFee = itemTotal * 0.01; // 1% default
          itemImpactGrams = (itemFee / csrPrice) * 1000;
        }
      } else {
        // SKU not found - use default 1% of price as plastic fee
        const itemTotal = item.price * item.quantity;
        itemFee = itemTotal * 0.01;
        itemImpactGrams = (itemFee / csrPrice) * 1000;
      }

      totalFee += itemFee;
      totalImpactGrams += itemImpactGrams;

      itemResults.push({
        sku: item.sku,
        quantity: item.quantity,
        impactGrams: Math.round(itemImpactGrams),
        feeEur: Math.round(itemFee * 100) / 100, // Round to 2 decimal places
      });
    }

    return {
      plasticFeeEur: Math.round(totalFee * 100) / 100,
      plasticFeePerItem: itemResults,
      totalImpactGrams: Math.round(totalImpactGrams),
      csrPricePerKg: csrPrice,
    };
  }

  /**
   * Create Stripe Checkout Session with split payment
   * This is called by merchant's checkout when customer is ready to pay
   *
   * Flow:
   * 1. Merchant calculates total (products + plastic fee)
   * 2. Merchant calls this endpoint
   * 3. We create Stripe Checkout Session with split payment
   * 4. Customer is redirected to Stripe Checkout
   * 5. After payment, Stripe splits: merchant gets product amount, CSR26 gets plastic fee
   */
  async createCheckoutSession(request: CreateCheckoutRequest): Promise<CheckoutResult> {
    // Validate merchant
    const merchant = await Merchant.findByPk(request.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Verify merchant can receive split payments
    if (!merchant.stripeAccountId) {
      throw new Error('Merchant has not connected their Stripe account. Complete Stripe Connect onboarding first.');
    }

    if (!merchant.stripeChargesEnabled) {
      throw new Error('Merchant Stripe account cannot accept charges. Complete onboarding or check account status.');
    }

    // Calculate totals
    const productTotal = request.items.reduce((sum, item) => sum + (item.priceEur * item.quantity), 0);
    const totalAmount = productTotal + request.plasticFeeEur;

    // Convert to cents for Stripe
    const totalAmountCents = Math.round(totalAmount * 100);
    const plasticFeeCents = Math.round(request.plasticFeeEur * 100);

    // Build line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add product items
    for (const item of request.items) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            metadata: { sku: item.sku },
          },
          unit_amount: Math.round(item.priceEur * 100),
        },
        quantity: item.quantity,
      });
    }

    // Add plastic neutralization fee as separate line item
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Plastic Neutralization Fee',
          description: 'Environmental impact offset - certified plastic removal',
        },
        unit_amount: plasticFeeCents,
      },
      quantity: 1,
    });

    // Create Stripe Checkout Session with destination charge
    // Merchant receives (total - plastic fee), CSR26 keeps plastic fee as application_fee
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: request.customer.email,
      // Split payment: funds go to connected account minus application fee
      payment_intent_data: {
        transfer_data: {
          destination: merchant.stripeAccountId,
        },
        application_fee_amount: plasticFeeCents, // CSR26 keeps the plastic fee
        metadata: {
          orderId: request.orderId,
          merchantId: request.merchantId,
          plasticFeeEur: request.plasticFeeEur.toFixed(2),
          partnerId: request.partnerId || '',
          ...request.metadata,
        },
      },
      success_url: `${request.successUrl}${request.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: request.cancelUrl,
      metadata: {
        orderId: request.orderId,
        merchantId: request.merchantId,
        customerEmail: request.customer.email,
        customerFirstName: request.customer.firstName,
        customerLastName: request.customer.lastName,
        plasticFeeEur: request.plasticFeeEur.toFixed(2),
        partnerId: request.partnerId || '',
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    });

    return {
      checkoutSessionId: session.id,
      checkoutUrl: session.url!,
      expiresAt: new Date(session.expires_at * 1000),
      splitDetails: {
        totalAmount,
        merchantReceives: productTotal,
        plasticFee: request.plasticFeeEur,
        platformFeePercent: 0, // No additional platform fee - plastic fee is the fee
      },
    };
  }

  /**
   * Complete checkout after successful Stripe payment
   * Called by merchant's success URL handler OR our Stripe webhook
   *
   * This creates:
   * 1. User record (from customer data)
   * 2. Transaction record
   * 3. Token for impact page (Point B)
   * 4. Returns impact URL for customer
   */
  async completeCheckout(request: CompleteCheckoutRequest): Promise<CheckoutCompletionResult> {
    // Get the Stripe session to verify payment and get details
    const session = await stripe.checkout.sessions.retrieve(request.checkoutSessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Check if this checkout session was already completed (idempotency check)
    const stripePaymentIntentId = (session.payment_intent as Stripe.PaymentIntent)?.id;
    if (stripePaymentIntentId) {
      const existingTransaction = await Transaction.findOne({
        where: { stripePaymentIntentId },
      });
      if (existingTransaction) {
        // Already processed - return existing data
        const existingToken = await transactionTokenService.getTokenByTransactionId(existingTransaction.id);
        const impactUrl = existingToken
          ? transactionTokenService.generateImpactUrl(existingTransaction.id, existingToken.token, env.frontend.url)
          : `${env.frontend.url}/landing?txn=${existingTransaction.id}`;

        const user = await User.findByPk(existingTransaction.userId);
        return {
          success: true,
          transactionId: existingTransaction.id,
          impactGrams: Number(existingTransaction.calculatedImpact),
          impactKg: Math.round(Number(existingTransaction.calculatedImpact) / 10) / 100,
          impactUrl,
          customer: {
            firstName: user?.firstName || '',
            email: user?.email || '',
          },
        };
      }
    }

    // Extract data from session metadata
    const metadata = session.metadata!;
    const plasticFeeEur = parseFloat(metadata.plasticFeeEur);
    const customerEmail = metadata.customerEmail;
    const customerFirstName = metadata.customerFirstName;
    const customerLastName = metadata.customerLastName;
    const partnerId = metadata.partnerId || undefined;

    // Find or create user - use standard registration (name + email)
    // E-commerce checkout doesn't always have full address data
    const user = await userService.findOrCreateStandardUser({
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      termsAccepted: true, // Implied by purchase
    });

    // Get CSR price for impact calculation
    const csrPrice = await configService.getCurrentCSRPrice();
    const impactKg = plasticFeeEur / csrPrice;
    const impactGrams = Math.round(impactKg * 1000);

    // Create transaction record
    // Use a generic ALLOCATION SKU for e-commerce transactions
    let ecommerceSku = await SKU.findOne({ where: { code: 'ECOM-SPLIT-01' } });
    if (!ecommerceSku) {
      // Create default e-commerce SKU if it doesn't exist
      ecommerceSku = await SKU.create({
        code: 'ECOM-SPLIT-01',
        name: 'E-commerce Plastic Neutral',
        description: 'Plastic neutralization from e-commerce checkout',
        paymentMode: PaymentMode.ALLOCATION,
        price: 0,
        productWeight: 0,
        impactMultiplier: 1,
        requiresValidation: false,
        corsairThreshold: 10,
        isActive: true,
      });
    }

    // Create transaction using the transaction service
    const transaction = await transactionService.createTransaction({
      skuCode: ecommerceSku.code,
      userId: user.id,
      merchantId: request.merchantId,
      partnerId,
      orderId: request.orderId,
      amount: plasticFeeEur,
    });

    // Update transaction with Stripe payment intent ID
    const paymentIntentId = (session.payment_intent as Stripe.PaymentIntent)?.id;
    if (paymentIntentId) {
      await transaction.update({ stripePaymentIntentId: paymentIntentId });
    }

    // Generate token for Point B landing page
    const token = await transactionTokenService.createToken(transaction.id);
    const impactUrl = transactionTokenService.generateImpactUrl(
      transaction.id,
      token.token,
      env.frontend.url
    );

    return {
      success: true,
      transactionId: transaction.id,
      impactGrams,
      impactKg: Math.round(impactKg * 100) / 100,
      impactUrl,
      customer: {
        firstName: customerFirstName,
        email: customerEmail,
      },
    };
  }

  /**
   * Get checkout session status
   * Merchants can call this to check if payment was successful
   */
  async getCheckoutStatus(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      customerEmail: session.customer_email,
      metadata: session.metadata,
    };
  }

  /**
   * Create a simple payment intent for direct integration
   * Alternative to Checkout Session - for merchants who handle their own UI
   *
   * Returns a client secret that merchant can use with Stripe.js
   */
  async createPaymentIntent(request: {
    merchantId: string;
    orderId: string;
    totalAmountEur: number;
    plasticFeeEur: number;
    customerEmail: string;
    partnerId?: string;
    metadata?: Record<string, string>;
  }) {
    const merchant = await Merchant.findByPk(request.merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    if (!merchant.stripeAccountId || !merchant.stripeChargesEnabled) {
      throw new Error('Merchant cannot accept split payments. Complete Stripe Connect onboarding.');
    }

    const totalCents = Math.round(request.totalAmountEur * 100);
    const plasticFeeCents = Math.round(request.plasticFeeEur * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      receipt_email: request.customerEmail,
      transfer_data: {
        destination: merchant.stripeAccountId,
      },
      application_fee_amount: plasticFeeCents,
      metadata: {
        orderId: request.orderId,
        merchantId: request.merchantId,
        plasticFeeEur: request.plasticFeeEur.toFixed(2),
        partnerId: request.partnerId || '',
        ...request.metadata,
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      splitDetails: {
        totalAmount: request.totalAmountEur,
        merchantReceives: request.totalAmountEur - request.plasticFeeEur,
        plasticFee: request.plasticFeeEur,
      },
    };
  }
}

export default new CheckoutService();
