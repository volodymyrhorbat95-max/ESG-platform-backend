'use strict';
const { v4: uuidv4 } = require('uuid');

// Import IDs from other seeders
const { USER_IDS } = require('./20240101000005-seed-users.cjs');
const { MERCHANT_IDS } = require('./20240101000002-seed-merchants.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('wallets', [
      // User wallets - values match seeded transactions
      // MARIO_ROSSI: 1 CLAIM transaction = 17.27g (from 0.0019 / 0.11 * 1000)
      // Amount spent: €0.0019 (below €10 threshold)
      {
        id: uuidv4(),
        user_id: USER_IDS.MARIO_ROSSI,
        merchant_id: null,
        total_accumulated: '17.27', // From CLAIM transaction (0.0019 / 0.11 * 1000 = 17.27g)
        total_redeemed: '0.00',
        current_balance: '17.27',
        total_amount_spent: '0.00', // CLAIM is prepaid - no user payment
        certified_asset_status: false, // Below €10 threshold
        created_at: new Date(),
        updated_at: new Date(),
      },
      // GIULIA_BIANCHI: 1 PAY (€2.50) + 1 ALLOCATION (€15) = €17.50 total
      // PAY: (2.5 / 0.11) * 1000 = 22727.27g
      // ALLOCATION: (15 / 0.11) * 1000 = 136363.64g (using standard formula now)
      {
        id: uuidv4(),
        user_id: USER_IDS.GIULIA_BIANCHI,
        merchant_id: null,
        total_accumulated: '159090.91', // PAY: 22727.27g + ALLOCATION: 136363.64g
        total_redeemed: '0.00',
        current_balance: '159090.91',
        total_amount_spent: '17.50', // €2.50 (PAY) + €15 (ALLOCATION) = €17.50
        certified_asset_status: true, // Above €10 threshold - certified asset
        created_at: new Date(),
        updated_at: new Date(),
      },
      // LUCA_VERDI: No transactions
      {
        id: uuidv4(),
        user_id: USER_IDS.LUCA_VERDI,
        merchant_id: null,
        total_accumulated: '0.00',
        total_redeemed: '0.00',
        current_balance: '0.00',
        total_amount_spent: '0.00',
        certified_asset_status: false,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Merchant wallets (prepaid lots)
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.CONAD,
        total_accumulated: '50000.00',
        total_redeemed: '10000.00',
        current_balance: '40000.00',
        total_amount_spent: '0.00', // Merchant wallets track prepaid credits, not spending
        certified_asset_status: false, // Not applicable to merchants
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.DELI,
        total_accumulated: '15000.00',
        total_redeemed: '5000.00',
        current_balance: '10000.00',
        total_amount_spent: '0.00',
        certified_asset_status: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.ALTROMERCATO,
        total_accumulated: '25000.00',
        total_redeemed: '8000.00',
        current_balance: '17000.00',
        total_amount_spent: '0.00',
        certified_asset_status: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.GIANNETTO,
        total_accumulated: '100000.00',
        total_redeemed: '30000.00',
        current_balance: '70000.00',
        total_amount_spent: '0.00',
        certified_asset_status: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Wallets seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('wallets', null, {});
  },
};
