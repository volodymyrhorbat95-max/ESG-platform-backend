'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 1. SEED PARTNERS
    const partnerAwareGrowthId = uuidv4();
    const partnerEcoAlliance = uuidv4();
    const partnerGreenBizId = uuidv4();

    await queryInterface.bulkInsert('partners', [
      {
        id: partnerAwareGrowthId,
        name: 'Aware Growth',
        email: 'billing@awaregrowth.com',
        contact_person: 'Marco Bianchi',
        phone: '+39 02 1234 5678',
        billing_address: 'Via Milano 100, 20100 Milan, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: partnerEcoAlliance,
        name: 'Eco Alliance Network',
        email: 'partnerships@ecoalliance.eu',
        contact_person: 'Sofia Ricci',
        phone: '+39 06 9876 5432',
        billing_address: 'Corso Vittorio Emanuele 250, 00186 Rome, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: partnerGreenBizId,
        name: 'Green Business Coalition',
        email: 'info@greenbiz.org',
        contact_person: 'Alessandro Verdi',
        phone: '+39 011 5555 7777',
        billing_address: 'Via Po 45, 10123 Turin, Italy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. SEED MERCHANTS
    const merchantConadId = uuidv4();
    const merchantDeliId = uuidv4();
    const merchantAltromercatoId = uuidv4();
    const merchantGiannettoId = uuidv4();

    await queryInterface.bulkInsert('merchants', [
      {
        id: merchantConadId,
        name: 'Conad Supermarket',
        email: 'info@conad.it',
        stripe_account_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: merchantDeliId,
        name: 'Artisan Pasta Deli',
        email: 'info@pastadeli.it',
        stripe_account_id: 'acct_test_deli_stripe',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: merchantAltromercatoId,
        name: 'Altromercato',
        email: 'info@altromercato.it',
        stripe_account_id: 'acct_test_altromercato',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: merchantGiannettoId,
        name: 'Giannetto Gift Cards',
        email: 'info@giannetto.it',
        stripe_account_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. SEED SKUs (Note: GlobalConfig already seeded in migration 007)
    const skuCaseAId = uuidv4();
    const skuCaseBLowId = uuidv4();
    const skuCaseBHighId = uuidv4();
    const skuCaseCLowId = uuidv4();
    const skuCaseCPayId = uuidv4();
    const skuCaseD25Id = uuidv4();
    const skuCaseD10Id = uuidv4();
    const skuCaseD5Id = uuidv4();
    const skuCaseEId = uuidv4();
    const skuClaimConadPromoId = uuidv4();

    await queryInterface.bulkInsert('skus', [
      {
        id: skuCaseAId,
        code: 'LOT-CONAD-01',
        name: 'Conad Plastic Neutral Receipt',
        price: 0,
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantConadId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseBLowId,
        code: 'ALLOC-MERCHANT-5',
        name: 'Merchant Funded 5€ Allocation',
        price: 5,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        partner_id: merchantDeliId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseBHighId,
        code: 'ALLOC-MERCHANT-15',
        name: 'Merchant Funded 15€ Allocation',
        price: 15,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        partner_id: merchantDeliId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseCLowId,
        code: 'ALLOC-ECOM-01',
        name: 'E-commerce Environmental Allocation',
        price: 0,
        payment_mode: 'ALLOCATION',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.6,
        partner_id: merchantAltromercatoId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseCPayId,
        code: 'PASTA-ARTISAN-01',
        name: 'Artisan Pasta Environmental Fee',
        price: 2.5,
        payment_mode: 'PAY',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantDeliId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseD25Id,
        code: 'GC-25EUR',
        name: 'Gift Card 25€',
        price: 25,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantGiannettoId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseD10Id,
        code: 'GC-10EUR',
        name: 'Gift Card 10€',
        price: 10,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantGiannettoId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseD5Id,
        code: 'GC-5EUR',
        name: 'Gift Card 5€',
        price: 5,
        payment_mode: 'GIFT_CARD',
        requires_validation: true,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantGiannettoId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuCaseEId,
        code: 'PROMO-GENERAL',
        name: 'CSR26 General Promotion',
        price: 0,
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: skuClaimConadPromoId,
        code: 'CLAIM-CONAD-PROMO',
        name: 'Conad Promotional Claim',
        price: 0,
        payment_mode: 'CLAIM',
        requires_validation: false,
        corsair_threshold: 10,
        impact_multiplier: 1.0,
        partner_id: merchantConadId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 4. SEED GIFT CARD CODES
    await queryInterface.bulkInsert('gift_card_codes', [
      { id: uuidv4(), code: 'GC25-AAAA-1111', sku_id: skuCaseD25Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC25-BBBB-2222', sku_id: skuCaseD25Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC25-CCCC-3333', sku_id: skuCaseD25Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC10-DDDD-4444', sku_id: skuCaseD10Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC10-EEEE-5555', sku_id: skuCaseD10Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC05-FFFF-6666', sku_id: skuCaseD5Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), code: 'GC05-GGGG-7777', sku_id: skuCaseD5Id, is_redeemed: false, redeemed_at: null, redeemed_by: null, created_at: new Date(), updated_at: new Date() },
    ]);

    // 5. SEED TEST USERS
    const userTestId = uuidv4();
    const userTest2Id = uuidv4();
    const userTest3Id = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: userTestId,
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario.rossi@test.com',
        date_of_birth: new Date('1985-06-15'),
        street: 'Via Roma 123',
        city: 'Milan',
        postal_code: '20100',
        country: 'Italy',
        state: 'Lombardy',
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: userTest2Id,
        first_name: 'Giulia',
        last_name: 'Bianchi',
        email: 'giulia.bianchi@test.com',
        date_of_birth: new Date('1990-03-22'),
        street: 'Via Dante 45',
        city: 'Rome',
        postal_code: '00100',
        country: 'Italy',
        state: 'Lazio',
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: userTest3Id,
        first_name: 'Luca',
        last_name: 'Verdi',
        email: 'luca.verdi@test.com',
        date_of_birth: new Date('1978-11-08'),
        street: 'Corso Italia 78',
        city: 'Naples',
        postal_code: '80100',
        country: 'Italy',
        state: 'Campania',
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 6. SEED WALLETS
    await queryInterface.bulkInsert('wallets', [
      { id: uuidv4(), user_id: userTestId, merchant_id: null, total_accumulated: 500, total_redeemed: 0, current_balance: 500, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: userTest2Id, merchant_id: null, total_accumulated: 1500, total_redeemed: 500, current_balance: 1000, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: userTest3Id, merchant_id: null, total_accumulated: 0, total_redeemed: 0, current_balance: 0, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: null, merchant_id: merchantConadId, total_accumulated: 50000, total_redeemed: 10000, current_balance: 40000, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: null, merchant_id: merchantDeliId, total_accumulated: 15000, total_redeemed: 5000, current_balance: 10000, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: null, merchant_id: merchantAltromercatoId, total_accumulated: 25000, total_redeemed: 8000, current_balance: 17000, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), user_id: null, merchant_id: merchantGiannettoId, total_accumulated: 100000, total_redeemed: 30000, current_balance: 70000, created_at: new Date(), updated_at: new Date() },
    ]);

    // 7. SEED SAMPLE TRANSACTIONS
    await queryInterface.bulkInsert('transactions', [
      {
        id: uuidv4(),
        user_id: userTestId,
        sku_id: skuCaseAId,
        merchant_id: merchantConadId,
        partner_id: null,
        order_id: null,
        amount: 0,
        calculated_impact: 500,
        payment_status: 'n/a',
        stripe_payment_intent_id: null,
        gift_card_code_id: null,
        corsair_connect_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: userTest2Id,
        sku_id: skuCaseCPayId,
        merchant_id: merchantDeliId,
        partner_id: null,
        order_id: null,
        amount: 2.5,
        calculated_impact: 250,
        payment_status: 'completed',
        stripe_payment_intent_id: 'pi_test_12345',
        gift_card_code_id: null,
        corsair_connect_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: userTest2Id,
        sku_id: skuCaseCLowId,
        merchant_id: null,
        partner_id: merchantAltromercatoId,
        order_id: null,
        amount: 15,
        calculated_impact: 24000,
        payment_status: 'n/a',
        stripe_payment_intent_id: null,
        gift_card_code_id: null,
        corsair_connect_flag: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('');
    console.log('🎉 Seeding completed!');
    console.log('');
    console.log('📋 Test URLs:');
    console.log(`   Case A: http://localhost:5173/?sku=LOT-CONAD-01&merchant=${merchantConadId}`);
    console.log(`   Case B (<€10): http://localhost:5173/?sku=ALLOC-MERCHANT-5&amount=5&merchant=${merchantDeliId}`);
    console.log(`   Case B (>=€10): http://localhost:5173/?sku=ALLOC-MERCHANT-15&amount=15&merchant=${merchantDeliId}`);
    console.log(`   Case C (<€10): http://localhost:5173/?sku=ALLOC-ECOM-01&amount=5&partner=${merchantAltromercatoId}`);
    console.log(`   Case C (>=€10): http://localhost:5173/?sku=ALLOC-ECOM-01&amount=15&partner=${merchantAltromercatoId}`);
    console.log('   Case D: http://localhost:5173/?sku=GC-25EUR');
    console.log('      Codes: GC25-AAAA-1111, GC25-BBBB-2222, GC25-CCCC-3333');
    console.log('   Case E: http://localhost:5173/?sku=PROMO-GENERAL');
    console.log('');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('wallets', null, {});
    await queryInterface.bulkDelete('gift_card_codes', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('skus', null, {});
    await queryInterface.bulkDelete('merchants', null, {});
    await queryInterface.bulkDelete('partners', null, {});
    await queryInterface.bulkDelete('global_config', null, {});
  },
};
