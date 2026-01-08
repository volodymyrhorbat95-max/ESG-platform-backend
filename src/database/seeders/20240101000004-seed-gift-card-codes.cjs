'use strict';

// Import SKU IDs for linking gift card codes to their SKUs
const { SKU_IDS } = require('./20240101000003-seed-skus.cjs');

// Pre-generated UUIDs for consistent seeding (must be valid hex: 0-9, a-f only)
// These can be used by transaction seeder if needed
const GIFT_CARD_IDS = {
  GC25_1: 'ac250001-0001-0001-0001-000000000001',
  GC25_2: 'ac250002-0002-0002-0002-000000000002',
  GC25_3: 'ac250003-0003-0003-0003-000000000003',
  GC10_1: 'ac100001-0001-0001-0001-000000000001',
  GC10_2: 'ac100002-0002-0002-0002-000000000002',
  GC05_1: 'ac050001-0001-0001-0001-000000000001',
  GC05_2: 'ac050002-0002-0002-0002-000000000002',
};

// Export for use by transaction seeder
module.exports.GIFT_CARD_IDS = GIFT_CARD_IDS;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Seed gift card codes for testing
    // Requirements from Section 8:
    // - Each code is unique, linked to a specific SKU
    // - ONE-TIME USE only - after validation, marked as redeemed with timestamp
    // - Validation flow: User enters code → system checks if valid and not redeemed
    await queryInterface.bulkInsert('gift_card_codes', [
      // 25€ Gift Cards (GC-25EUR SKU)
      // Impact at €0.11/kg: 25 / 0.11 = 227.27 kg = 227,272 grams
      // Triggers Corsair Connect (>= €10 threshold)
      {
        id: GIFT_CARD_IDS.GC25_1,
        code: 'GC25-AAAA-1111',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: GIFT_CARD_IDS.GC25_2,
        code: 'GC25-BBBB-2222',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: GIFT_CARD_IDS.GC25_3,
        code: 'GC25-CCCC-3333',
        sku_id: SKU_IDS.GC_25EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // 10€ Gift Cards (GC-10EUR SKU)
      // Impact at €0.11/kg: 10 / 0.11 = 90.91 kg = 90,909 grams
      // Triggers Corsair Connect (>= €10 threshold)
      {
        id: GIFT_CARD_IDS.GC10_1,
        code: 'GC10-DDDD-4444',
        sku_id: SKU_IDS.GC_10EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: GIFT_CARD_IDS.GC10_2,
        code: 'GC10-EEEE-5555',
        sku_id: SKU_IDS.GC_10EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // 5€ Gift Cards (GC-5EUR SKU)
      // Impact at €0.11/kg: 5 / 0.11 = 45.45 kg = 45,454 grams
      // Does NOT trigger Corsair Connect (< €10 threshold) - Accumulation status
      {
        id: GIFT_CARD_IDS.GC05_1,
        code: 'GC05-FFFF-6666',
        sku_id: SKU_IDS.GC_5EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: GIFT_CARD_IDS.GC05_2,
        code: 'GC05-GGGG-7777',
        sku_id: SKU_IDS.GC_5EUR,
        is_redeemed: false,
        redeemed_at: null,
        redeemed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ Gift card codes seeded (7 codes: 3x€25, 2x€10, 2x€5)');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('gift_card_codes', null, {});
  },
};
