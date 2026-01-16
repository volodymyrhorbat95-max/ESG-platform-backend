# CSR26 Merchant E-commerce Integration Guide

## Overview

This guide explains how to integrate the CSR26 plastic-neutral checkout into your e-commerce platform. The integration allows your customers to offset the plastic impact of their purchases with instant payment splitting.

## How It Works

### The Two-Point Flow

**POINT A - Checkout (Customer Payment)**
1. Customer adds products to cart on your site
2. Your checkout calculates the plastic neutralization fee
3. You call CSR26 API to create a split payment session
4. Customer pays the total (products + plastic fee)
5. Stripe splits payment IMMEDIATELY:
   - Your store receives: Product amount
   - CSR26 receives: Plastic neutralization fee

**POINT B - Thank You Page (Post-Payment)**
1. After successful payment, you show a button/QR code
2. Customer clicks → CSR26 impact landing page
3. Customer sees personalized message: "Thank you [Name]! You just removed [X]kg of plastic"
4. NO form filling needed - data comes from the checkout

---

## Prerequisites

### 1. Merchant Account
Contact CSR26 admin to create your merchant account. You'll receive:
- `merchantId` - Your unique merchant identifier
- `webhookSecret` - API key for authentication (optional but recommended)

### 2. Stripe Connect Onboarding
Your store needs a connected Stripe account to receive split payments:
1. CSR26 admin initiates Stripe Connect onboarding
2. You receive an onboarding URL
3. Complete Stripe's verification process
4. Once approved, your account can receive payments

---

## API Endpoints

Base URL: `https://api.csr26.it` (or your deployment URL)

### Authentication
Include your `webhookSecret` as an API key header:
```
X-API-Key: your_webhook_secret_here
```

---

## Integration Flow

### Step 1: Calculate Plastic Fee

Before showing the checkout total, calculate the plastic fee for the cart items.

**Endpoint:** `POST /api/checkout/calculate-fee`

**Request:**
```json
{
  "merchantId": "your-merchant-uuid",
  "items": [
    { "sku": "PRODUCT-001", "quantity": 2, "price": 25.00 },
    { "sku": "PRODUCT-002", "quantity": 1, "price": 50.00 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plasticFeeEur": 1.00,
    "plasticFeePerItem": [
      { "sku": "PRODUCT-001", "quantity": 2, "impactGrams": 4545, "feeEur": 0.50 },
      { "sku": "PRODUCT-002", "quantity": 1, "impactGrams": 4545, "feeEur": 0.50 }
    ],
    "totalImpactGrams": 9090,
    "csrPricePerKg": 0.11
  }
}
```

### Step 2: Create Checkout Session

When customer clicks "Pay", create a Stripe Checkout Session with split payment.

**Endpoint:** `POST /api/checkout/create-session`

**Request:**
```json
{
  "merchantId": "your-merchant-uuid",
  "orderId": "ORDER-12345",
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "Rome",
    "postalCode": "00100",
    "country": "IT"
  },
  "items": [
    { "sku": "PRODUCT-001", "name": "Eco T-Shirt", "quantity": 2, "priceEur": 25.00 },
    { "sku": "PRODUCT-002", "name": "Organic Bag", "quantity": 1, "priceEur": 50.00 }
  ],
  "plasticFeeEur": 1.00,
  "successUrl": "https://yourstore.com/checkout/success",
  "cancelUrl": "https://yourstore.com/checkout/cancel",
  "partnerId": "optional-affiliate-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutSessionId": "cs_test_xxx",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_xxx",
    "expiresAt": "2026-01-15T12:30:00Z",
    "splitDetails": {
      "totalAmount": 101.00,
      "merchantReceives": 100.00,
      "plasticFee": 1.00,
      "platformFeePercent": 0
    }
  }
}
```

**Next:** Redirect customer to `checkoutUrl` to complete payment.

### Step 3: Handle Success Callback

After successful payment, Stripe redirects to your `successUrl` with a `session_id` parameter.

**Your Success URL will be:** `https://yourstore.com/checkout/success?session_id=cs_test_xxx`

### Step 4: Complete Checkout & Get Impact URL

Call our API to complete the checkout and get the customer's impact URL.

**Endpoint:** `POST /api/checkout/complete`

**Request:**
```json
{
  "merchantId": "your-merchant-uuid",
  "checkoutSessionId": "cs_test_xxx",
  "orderId": "ORDER-12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-uuid",
    "impactGrams": 9090,
    "impactKg": 9.09,
    "impactUrl": "https://csr26.it/landing?txn=txn-uuid&token=secure-token",
    "customer": {
      "firstName": "John",
      "email": "customer@example.com"
    }
  }
}
```

### Step 5: Show Impact on Thank You Page

Display the impact to the customer on your thank you page:

```html
<div class="impact-section">
  <h2>Thank you, John!</h2>
  <p>With this purchase, you've helped remove <strong>9.09 kg</strong> of plastic from the environment!</p>
  <a href="https://csr26.it/landing?txn=txn-uuid&token=secure-token" class="btn">
    View Your Environmental Impact
  </a>
</div>
```

---

## Alternative: Direct Payment Intent

For custom checkout UIs (not using Stripe Checkout), use the Payment Intent endpoint.

**Endpoint:** `POST /api/checkout/create-payment-intent`

**Request:**
```json
{
  "merchantId": "your-merchant-uuid",
  "orderId": "ORDER-12345",
  "totalAmountEur": 101.00,
  "plasticFeeEur": 1.00,
  "customerEmail": "customer@example.com",
  "partnerId": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_yyy",
    "splitDetails": {
      "totalAmount": 101.00,
      "merchantReceives": 100.00,
      "plasticFee": 1.00
    }
  }
}
```

Use the `clientSecret` with Stripe.js to complete payment in your custom form.

---

## Check Session Status

Poll the status of a checkout session:

**Endpoint:** `GET /api/checkout/status/:sessionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "paymentStatus": "paid",
    "status": "complete",
    "amountTotal": 101.00,
    "currency": "eur"
  }
}
```

---

## WooCommerce Integration Example

### 1. Add Plastic Fee to Cart

```php
// functions.php or custom plugin
add_action('woocommerce_cart_calculate_fees', 'add_plastic_neutralization_fee');

function add_plastic_neutralization_fee($cart) {
    if (is_admin() && !defined('DOING_AJAX')) return;

    $items = [];
    foreach ($cart->get_cart() as $cart_item) {
        $items[] = [
            'sku' => $cart_item['data']->get_sku(),
            'quantity' => $cart_item['quantity'],
            'price' => $cart_item['data']->get_price()
        ];
    }

    // Call CSR26 API to calculate fee
    $response = wp_remote_post('https://api.csr26.it/api/checkout/calculate-fee', [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode([
            'merchantId' => 'your-merchant-uuid',
            'items' => $items
        ])
    ]);

    $data = json_decode(wp_remote_retrieve_body($response), true);

    if ($data['success']) {
        $cart->add_fee('Plastic Neutralization', $data['data']['plasticFeeEur']);
    }
}
```

### 2. Redirect to CSR26 Checkout

Override the WooCommerce checkout to use CSR26's split payment:

```php
add_action('woocommerce_checkout_process', 'redirect_to_csr26_checkout');

function redirect_to_csr26_checkout() {
    // Create CSR26 checkout session
    // Redirect customer to Stripe Checkout
    // Handle success callback
}
```

---

## Webhook Integration (Optional)

Instead of polling, you can receive webhook notifications when payment completes.

### Setup Webhook
Configure your e-commerce platform to send order webhooks to CSR26:

**Webhook URL:** `https://api.csr26.it/api/webhooks/ecommerce/{merchantId}`

CSR26 will:
1. Verify the webhook signature
2. Create user and transaction records
3. Send confirmation email to customer with impact URL

---

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Merchant not found" | Invalid merchantId | Check your merchant ID |
| "Merchant cannot accept split payments" | Stripe Connect not set up | Complete Stripe onboarding |
| "Payment not completed" | Customer didn't pay | Wait for payment or retry |
| "Invalid API key" | Wrong webhookSecret | Check your API key header |

---

## Testing

### Test Mode
Use Stripe test mode for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Test Flow
1. Create checkout session with test merchant
2. Complete payment with test card
3. Verify split in Stripe Dashboard
4. Check impact URL works

---

## Support

- **Technical Issues:** Create issue on GitHub
- **Account Setup:** Contact CSR26 admin
- **Stripe Connect:** Check Stripe Dashboard

---

## Changelog

### v1.0.0 (2026-01-15)
- Initial release
- Stripe Checkout Session integration
- Payment Intent support
- Automatic impact URL generation
