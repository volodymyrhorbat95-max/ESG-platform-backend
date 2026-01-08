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
      // MARIO_ROSSI: 1 CLAIM transaction = 17g
      {
        id: uuidv4(),
        user_id: USER_IDS.MARIO_ROSSI,
        merchant_id: null,
        total_accumulated: 17, // From CLAIM transaction (0.00187 / 0.11 * 1000 = 17g)
        total_redeemed: 0,
        current_balance: 17,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // GIULIA_BIANCHI: 1 PAY (22727g) + 1 ALLOCATION (218182g) = 240909g
      {
        id: uuidv4(),
        user_id: USER_IDS.GIULIA_BIANCHI,
        merchant_id: null,
        total_accumulated: 240909, // PAY: 22727g + ALLOCATION: 218182g
        total_redeemed: 0,
        current_balance: 240909,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // LUCA_VERDI: No transactions
      {
        id: uuidv4(),
        user_id: USER_IDS.LUCA_VERDI,
        merchant_id: null,
        total_accumulated: 0,
        total_redeemed: 0,
        current_balance: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Merchant wallets (prepaid lots)
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.CONAD,
        total_accumulated: 50000,
        total_redeemed: 10000,
        current_balance: 40000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.DELI,
        total_accumulated: 15000,
        total_redeemed: 5000,
        current_balance: 10000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.ALTROMERCATO,
        total_accumulated: 25000,
        total_redeemed: 8000,
        current_balance: 17000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        user_id: null,
        merchant_id: MERCHANT_IDS.GIANNETTO,
        total_accumulated: 100000,
        total_redeemed: 30000,
        current_balance: 70000,
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
