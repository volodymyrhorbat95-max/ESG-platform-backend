'use strict';
const { v4: uuidv4 } = require('uuid');

// Import IDs from other seeders
const { PARTNER_IDS } = require('./20240101000001-seed-partners.cjs');
const { MERCHANT_IDS } = require('./20240101000002-seed-merchants.cjs');
const { SKU_IDS } = require('./20240101000003-seed-skus.cjs');
const { USER_IDS } = require('./20240101000005-seed-users.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('transactions', [
      // Case A: CLAIM transaction (prepaid lot, no customer payment)
      // The amount represents the prepaid value allocated per claim, NOT customer payment
      // Impact = (amount / CSR_PRICE) * impactMultiplier * 1000 grams
      // Example: (0.00187 / 0.11) * 1.0 * 1000 = 17 grams
      {
        id: uuidv4(),
        user_id: USER_IDS.MARIO_ROSSI,
        sku_id: SKU_IDS.LOT_CONAD_01,
        merchant_id: MERCHANT_IDS.CONAD,
        partner_id: null,
        order_id: null,
        amount: 0.00187, // Prepaid value per claim from SKU LOT-CONAD-01
        calculated_impact: 17, // (0.00187 / 0.11) * 1.0 * 1000 = 17 grams
        payment_status: 'n/a',
        stripe_payment_intent_id: null,
        gift_card_code_id: null,
        corsair_connect_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case C: PAY transaction (Stripe payment completed)
      {
        id: uuidv4(),
        user_id: USER_IDS.GIULIA_BIANCHI,
        sku_id: SKU_IDS.PASTA_ARTISAN_01,
        merchant_id: MERCHANT_IDS.DELI,
        partner_id: null,
        order_id: null,
        amount: 2.5,
        // Impact = (2.5 / 0.11) * 1.0 * 1000 ≈ 22727 grams
        calculated_impact: 22727,
        payment_status: 'completed',
        stripe_payment_intent_id: 'pi_test_12345',
        gift_card_code_id: null,
        corsair_connect_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Case C: ALLOCATION transaction (e-commerce flow, €15 >= threshold)
      // merchant_id: Altromercato is the merchant
      // partner_id: Eco Alliance is the e-commerce integration partner
      // ALLOCATION uses SPECIAL formula: amount × impactMultiplier = kg (NOT standard €0.11/kg!)
      {
        id: uuidv4(),
        user_id: USER_IDS.GIULIA_BIANCHI,
        sku_id: SKU_IDS.ALLOC_ECOM_01,
        merchant_id: MERCHANT_IDS.ALTROMERCATO,
        partner_id: PARTNER_IDS.ECO_ALLIANCE,
        order_id: 'ORDER-12345',
        amount: 15,
        // ALLOCATION Impact = amount × impactMultiplier × 1000 = 15 × 1.6 × 1000 = 24000 grams (24 kg)
        calculated_impact: 24000,
        payment_status: 'n/a',
        stripe_payment_intent_id: null,
        gift_card_code_id: null,
        corsair_connect_flag: true, // €15 >= €10 threshold
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Transactions seeded');
    console.log('');
    console.log('📋 Test URLs:');
    console.log(`   Case A (CLAIM): http://localhost:5173/?sku=LOT-CONAD-01&merchant=${MERCHANT_IDS.CONAD}`);
    console.log(`   Case B (<€10): http://localhost:5173/?sku=ALLOC-MERCHANT-5&amount=5&merchant=${MERCHANT_IDS.DELI}`);
    console.log(`   Case B (>=€10): http://localhost:5173/?sku=ALLOC-MERCHANT-15&amount=15&merchant=${MERCHANT_IDS.DELI}`);
    console.log(`   Case C (<€10): http://localhost:5173/?sku=ALLOC-ECOM-01&amount=5&merchant=${MERCHANT_IDS.ALTROMERCATO}&partner=${PARTNER_IDS.ECO_ALLIANCE}`);
    console.log(`   Case C (>=€10): http://localhost:5173/?sku=ALLOC-ECOM-01&amount=15&merchant=${MERCHANT_IDS.ALTROMERCATO}&partner=${PARTNER_IDS.ECO_ALLIANCE}`);
    console.log('   Case D (GIFT_CARD): http://localhost:5173/?sku=GC-25EUR');
    console.log('      Codes: GC25-AAAA-1111, GC25-BBBB-2222, GC25-CCCC-3333');
    console.log('   Case E (CLAIM): http://localhost:5173/?sku=PROMO-GENERAL');
    console.log('');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('transactions', null, {});
  },
};
