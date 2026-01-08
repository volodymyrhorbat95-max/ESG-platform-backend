'use strict';

// Import partner and merchant IDs
const { PARTNER_IDS } = require('./20240101000001-seed-partners.cjs');
const { MERCHANT_IDS } = require('./20240101000002-seed-merchants.cjs');

// Fixed UUIDs for cross-seeder references (must be valid hex: 0-9, a-f)
const SKU_IDS = {
  // Case A: CLAIM (prepaid lot, email only)
  LOT_CONAD_01: '5c000001-0001-0001-0001-000000000001',
  CLAIM_CONAD_PROMO: '5c000001-0001-0001-0001-000000000010',
  PROMO_GENERAL: '5c000001-0001-0001-0001-000000000009',

  // Case B/C: ALLOCATION (merchant-funded, amount in URL)
  ALLOC_MERCHANT_5: '5c000001-0001-0001-0001-000000000002',
  ALLOC_MERCHANT_15: '5c000001-0001-0001-0001-000000000003',
  ALLOC_ECOM_01: '5c000001-0001-0001-0001-000000000004',

  // Case C: PAY (Stripe payment)
  PASTA_ARTISAN_01: '5c000001-0001-0001-0001-000000000005',

  // Case D: GIFT_CARD (secret code validation)
  GC_25EUR: '5c000001-0001-0001-0001-000000000006',
  GC_10EUR: '5c000001-0001-0001-0001-000000000007',
  GC_5EUR: '5c000001-0001-0001-0001-000000000008',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('skus', [
      // Case A: CLAIM - Prepaid Lot (email only, no customer payment)
      // The merchant has already paid in advance for this impact credit.
      // price = prepaid value per claim (e.g., €0.00187 gives 17g at €0.11/kg)
      // Formula: impact = (price / 0.11) * impactMultiplier * 1000 grams
      // Example: (0.00187 / 0.11) * 1.0 * 1000 = 17 grams
      {
        id: SKU_IDS.LOT_CONAD_01,
        code: 'LOT-CONAD-01',
        name: 'Conad Plastic Neutral Receipt',
        price: 0.00187, // €0.00187 = ~17g plastic impact at €0.11/kg
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.CONAD,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SKU_IDS.CLAIM_CONAD_PROMO,
        code: 'CLAIM-CONAD-PROMO',
        name: 'Conad 10X Promotional Claim',
        price: 0.0187, // €0.0187 = ~170g plastic impact (10X campaign)
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.CONAD,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SKU_IDS.PROMO_GENERAL,
        code: 'PROMO-GENERAL',
        name: 'CSR26 General Promotion',
        price: 0.0055, // €0.0055 = ~50g plastic impact
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: null,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case B: ALLOCATION - Merchant funded (amount in URL, impactMultiplier 1.6)
      // merchant_id: Deli owns this SKU
      {
        id: SKU_IDS.ALLOC_MERCHANT_5,
        code: 'ALLOC-MERCHANT-5',
        name: 'Merchant Funded 5€ Allocation',
        price: 5,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        merchant_id: MERCHANT_IDS.DELI,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SKU_IDS.ALLOC_MERCHANT_15,
        code: 'ALLOC-MERCHANT-15',
        name: 'Merchant Funded 15€ Allocation',
        price: 15,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        merchant_id: MERCHANT_IDS.DELI,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case C: ALLOCATION with partner (e-commerce flow)
      // partner_id: Eco Alliance is the e-commerce integration partner
      // merchant_id: Altromercato is the merchant selling products
      {
        id: SKU_IDS.ALLOC_ECOM_01,
        code: 'ALLOC-ECOM-01',
        name: 'E-commerce Environmental Allocation',
        price: 0,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        merchant_id: MERCHANT_IDS.ALTROMERCATO,
        partner_id: PARTNER_IDS.ECO_ALLIANCE,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case C variant: PAY - User pays via Stripe
      // merchant_id: Deli receives payment via Stripe Connect
      {
        id: SKU_IDS.PASTA_ARTISAN_01,
        code: 'PASTA-ARTISAN-01',
        name: 'Artisan Pasta Environmental Fee',
        price: 2.5,
        payment_mode: 'PAY',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.DELI,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case D: GIFT_CARD - Secret code validation required
      // merchant_id: Giannetto sells gift cards
      {
        id: SKU_IDS.GC_25EUR,
        code: 'GC-25EUR',
        name: 'Gift Card 25€',
        price: 25,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.GIANNETTO,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SKU_IDS.GC_10EUR,
        code: 'GC-10EUR',
        name: 'Gift Card 10€',
        price: 10,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.GIANNETTO,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SKU_IDS.GC_5EUR,
        code: 'GC-5EUR',
        name: 'Gift Card 5€',
        price: 5,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        merchant_id: MERCHANT_IDS.GIANNETTO,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ SKUs seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('skus', null, {});
  },

  // Export IDs for other seeders
  SKU_IDS,
};
