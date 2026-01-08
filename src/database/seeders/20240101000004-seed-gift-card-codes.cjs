'use strict';
const { v4: uuidv4 } = require('uuid');

// Import SKU IDs
const { SKU_IDS } = require('./20240101000003-seed-skus.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('gift_card_codes', [
      // 25€ Gift Cards
      {
        id: uuidv4(),
        code: 'GC25-AAAA-1111',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'GC25-BBBB-2222',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'GC25-CCCC-3333',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // 10€ Gift Cards
      {
        id: uuidv4(),
        code: 'GC10-DDDD-4444',
        sku_id: SKU_IDS.GC_10EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'GC10-EEEE-5555',
        sku_id: SKU_IDS.GC_10EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // 5€ Gift Cards
      {
        id: uuidv4(),
        code: 'GC05-FFFF-6666',
        sku_id: SKU_IDS.GC_5EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        code: 'GC05-GGGG-7777',
        sku_id: SKU_IDS.GC_5EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Gift card codes seeded');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('gift_card_codes', null, {});
  },
};
