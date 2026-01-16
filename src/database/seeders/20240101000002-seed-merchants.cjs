'use strict';

// Fixed UUIDs for cross-seeder references
const MERCHANT_IDS = {
  CONAD: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  DELI: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  ALTROMERCATO: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  GIANNETTO: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('merchants', [
      {
        id: MERCHANT_IDS.CONAD,
        name: 'Conad Supermarket',
        email: 'info@conad.it',
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_complete: false,
        webhook_secret: null,
        webhook_platform: null,
        webhook_endpoint_url: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: MERCHANT_IDS.DELI,
        name: 'Artisan Pasta Deli',
        email: 'info@pastadeli.it',
        stripe_account_id: 'acct_test_deli_stripe',
        stripe_account_status: 'active',
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        stripe_onboarding_complete: true,
        webhook_secret: 'whsec_test_deli_secret',
        webhook_platform: 'WOOCOMMERCE',
        webhook_endpoint_url: '/api/webhooks/merchant/deli',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: MERCHANT_IDS.ALTROMERCATO,
        name: 'Altromercato',
        email: 'info@altromercato.it',
        stripe_account_id: 'acct_test_altromercato',
        stripe_account_status: 'active',
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        stripe_onboarding_complete: true,
        webhook_secret: 'whsec_test_altromercato_secret',
        webhook_platform: 'SHOPIFY',
        webhook_endpoint_url: '/api/webhooks/merchant/altromercato',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: MERCHANT_IDS.GIANNETTO,
        name: 'Giannetto Gift Cards',
        email: 'info@giannetto.it',
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_complete: false,
        webhook_secret: null,
        webhook_platform: null,
        webhook_endpoint_url: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Merchants seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('merchants', null, {});
  },

  // Export IDs for other seeders
  MERCHANT_IDS,
};
