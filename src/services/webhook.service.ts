// Webhook Service - Process e-commerce platform webhooks
// Section 20.4: WooCommerce/E-commerce Integration
import crypto from 'crypto';
import { Merchant, SKU, User, Transaction } from '../database/models/index.js';
import { WebhookPlatform } from '../database/models/Merchant.js';
import transactionService from './transaction.service.js';
import userService from './user.service.js';
import qrcodeService from './qrcode.service.js';
import emailService from './email.service.js';
import { env } from '../config/env.js';

// WooCommerce webhook payload interface
interface WooCommerceOrderWebhook {
  id: number;
  status: string;
  total: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;
    state: string;
    phone?: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    sku: string;
    quantity: number;
    total: string;
    subtotal: string;
  }>;
  meta_data?: Array<{
    key: string;
    value: any;
  }>;
}

// Shopify webhook payload interface
interface ShopifyOrderWebhook {
  id: number;
  order_number: string;
  total_price: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  billing_address: {
    address1: string;
    address2?: string;
    city: string;
    zip: string;
    country: string;
    province: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    sku: string;
    quantity: number;
    price: string;
  }>;
}

// Generic processed order interface
interface ProcessedOrder {
  orderId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    state?: string;
  };
  items: Array<{
    sku: string;
    quantity: number;
    total: number;
  }>;
  partnerId?: string;
}

class WebhookService {
  /**
   * Verify webhook signature
   * Different platforms use different signature methods
   */
  verifySignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    platform: WebhookPlatform
  ): boolean {
    try {
      switch (platform) {
        case 'WOOCOMMERCE':
          return this.verifyWooCommerceSignature(payload, signature, secret);
        case 'SHOPIFY':
          return this.verifyShopifySignature(payload, signature, secret);
        case 'CUSTOM':
          return this.verifyCustomSignature(payload, signature, secret);
        default:
          console.error(`Unknown webhook platform: ${platform}`);
          return false;
      }
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * WooCommerce signature verification
   * Uses HMAC SHA256 with base64 encoding
   */
  private verifyWooCommerceSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Shopify signature verification
   * Uses HMAC SHA256 with base64 encoding
   */
  private verifyShopifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Custom platform signature verification
   * Uses HMAC SHA256 with hex encoding (configurable)
   */
  private verifyCustomSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Process webhook from e-commerce platform
   * Main entry point for webhook processing
   */
  async processWebhook(
    merchantId: string,
    payload: any,
    platform: WebhookPlatform
  ): Promise<{ success: boolean; transactionIds: string[]; qrCodes?: any[] }> {
    console.log(`📦 Processing ${platform} webhook for merchant ${merchantId}`);

    // Find merchant
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Parse order data based on platform
    const processedOrder = this.parseOrderData(payload, platform);

    // Create or find user
    const user = await this.findOrCreateUserFromOrder(processedOrder.customer, merchant.id);

    // Process each line item as a separate transaction
    const transactionIds: string[] = [];
    const qrCodes: any[] = [];

    for (const item of processedOrder.items) {
      // Find SKU by code
      const sku = await SKU.findOne({ where: { code: item.sku } });
      if (!sku) {
        console.warn(`⚠️ SKU not found: ${item.sku} - skipping line item`);
        continue;
      }

      // Create transaction for this item
      const transaction = await transactionService.createTransaction({
        userId: user.id,
        skuCode: sku.code,
        merchantId: merchant.id,
        partnerId: processedOrder.partnerId,
        orderId: processedOrder.orderId,
        amount: item.total,
      });

      transactionIds.push(transaction.id);

      // Generate QR code for customer (they can verify their impact)
      const qrCode = await qrcodeService.generateQRCode({
        merchantId: merchant.id,
        skuCode: sku.code,
        baseUrl: env.frontend.url,
        format: 'png',
      });

      qrCodes.push({
        transactionId: transaction.id,
        sku: item.sku,
        qrCode: qrCode.qrCodeData,
        targetUrl: qrCode.targetUrl,
      });
    }

    // Send confirmation email with QR codes
    if (transactionIds.length > 0) {
      await this.sendOrderConfirmationEmail(user, transactionIds, qrCodes);
    }

    console.log(`✅ Webhook processed - Created ${transactionIds.length} transactions for order ${processedOrder.orderId}`);

    return {
      success: true,
      transactionIds,
      qrCodes,
    };
  }

  /**
   * Parse order data from platform-specific payload
   */
  private parseOrderData(payload: any, platform: WebhookPlatform): ProcessedOrder {
    switch (platform) {
      case 'WOOCOMMERCE':
        return this.parseWooCommerceOrder(payload as WooCommerceOrderWebhook);
      case 'SHOPIFY':
        return this.parseShopifyOrder(payload as ShopifyOrderWebhook);
      case 'CUSTOM':
        return this.parseCustomOrder(payload);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  /**
   * Parse WooCommerce order webhook
   */
  private parseWooCommerceOrder(order: WooCommerceOrderWebhook): ProcessedOrder {
    // Extract partner ID from meta_data if present
    const partnerMeta = order.meta_data?.find(m => m.key === 'csr26_partner_id');
    const partnerId = partnerMeta?.value;

    return {
      orderId: `WC-${order.id}`,
      customer: {
        firstName: order.billing.first_name,
        lastName: order.billing.last_name,
        email: order.billing.email,
        street: `${order.billing.address_1}${order.billing.address_2 ? ' ' + order.billing.address_2 : ''}`,
        city: order.billing.city,
        postalCode: order.billing.postcode,
        country: order.billing.country,
        state: order.billing.state,
      },
      items: order.line_items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        total: parseFloat(item.total),
      })),
      partnerId,
    };
  }

  /**
   * Parse Shopify order webhook
   */
  private parseShopifyOrder(order: ShopifyOrderWebhook): ProcessedOrder {
    return {
      orderId: `SHOPIFY-${order.order_number}`,
      customer: {
        firstName: order.customer.first_name,
        lastName: order.customer.last_name,
        email: order.customer.email,
        street: `${order.billing_address.address1}${order.billing_address.address2 ? ' ' + order.billing_address.address2 : ''}`,
        city: order.billing_address.city,
        postalCode: order.billing_address.zip,
        country: order.billing_address.country,
        state: order.billing_address.province,
      },
      items: order.line_items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        total: parseFloat(item.price) * item.quantity,
      })),
    };
  }

  /**
   * Parse custom platform order
   */
  private parseCustomOrder(order: any): ProcessedOrder {
    // Flexible parsing for custom platforms
    // Expects order to have: orderId, customer, items, partnerId (optional)
    return {
      orderId: order.orderId || order.id || 'CUSTOM-' + Date.now(),
      customer: {
        firstName: order.customer.firstName || order.customer.first_name,
        lastName: order.customer.lastName || order.customer.last_name,
        email: order.customer.email,
        street: order.customer.street || order.customer.address,
        city: order.customer.city,
        postalCode: order.customer.postalCode || order.customer.zip || order.customer.postcode,
        country: order.customer.country,
        state: order.customer.state || order.customer.province,
      },
      items: order.items.map((item: any) => ({
        sku: item.sku || item.skuCode,
        quantity: item.quantity || 1,
        total: item.total || item.price || 0,
      })),
      partnerId: order.partnerId,
    };
  }

  /**
   * Find or create user from order customer data
   */
  private async findOrCreateUserFromOrder(
    customer: ProcessedOrder['customer'],
    merchantId: string
  ): Promise<User> {
    // Create new user with full registration (e-commerce orders require full data)
    const user = await userService.findOrCreateFullUser({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      street: customer.street,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      state: customer.state,
      dateOfBirth: '2000-01-01', // Placeholder - can be updated by user later
      termsAccepted: true, // Implied by e-commerce purchase
    });

    console.log(`✅ Found/created user from e-commerce order: ${customer.email}`);

    return user;
  }

  /**
   * Send order confirmation email with QR codes
   */
  private async sendOrderConfirmationEmail(
    user: User,
    transactionIds: string[],
    qrCodes: any[]
  ): Promise<void> {
    // For now, send individual transaction confirmations
    // TODO: Create a combined order confirmation email template
    for (const transactionId of transactionIds) {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [{ model: SKU, as: 'sku' }],
      });

      if (transaction) {
        await emailService.sendTransactionConfirmation(
          user.email,
          `${user.firstName} ${user.lastName}`,
          {
            id: transaction.id,
            impactGrams: Number(transaction.calculatedImpact),
            impactKg: (Number(transaction.calculatedImpact) / 1000).toFixed(3),
            date: transaction.createdAt.toISOString().split('T')[0],
            sku: { code: transaction.sku.code, name: transaction.sku.name },
            amount: Number(transaction.amount),
          },
          user.id
        );
      }
    }

    console.log(`✅ Sent order confirmation emails for ${transactionIds.length} transactions`);
  }

  /**
   * Generate webhook endpoint URL for a merchant
   * Used when merchant configures their webhook in their e-commerce platform
   */
  generateWebhookEndpointUrl(merchantId: string): string {
    return `${env.backendUrl}/api/webhooks/ecommerce/${merchantId}`;
  }
}

export default new WebhookService();
