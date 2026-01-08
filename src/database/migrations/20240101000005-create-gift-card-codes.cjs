'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create gift_card_codes table for ONE-TIME USE gift card validation
    // Requirements from Section 8:
    // - Each code is unique, linked to a specific SKU
    // - ONE-TIME USE only - after validation, marked as redeemed with timestamp
    // - Validation flow: User enters code → system checks if valid and not redeemed → if valid, proceed
    // - Admin can bulk create and bulk invalidate codes
    await queryInterface.createTable('gift_card_codes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique secret code for gift card validation - found on physical gift card',
      },
      sku_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skus',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Reference to GIFT_CARD type SKU (e.g., GC-25EUR, GC-10EUR, GC-5EUR)',
      },
      is_redeemed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ONE-TIME USE enforcement - true after code is validated and used',
      },
      redeemed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when code was redeemed - null if not yet used',
      },
      redeemed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User ID who redeemed the code - null for admin invalidation',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Index for fast code lookup during validation
    await queryInterface.addIndex('gift_card_codes', ['code'], { unique: true });
    // Index for filtering codes by SKU in admin panel
    await queryInterface.addIndex('gift_card_codes', ['sku_id']);
    // Index for filtering available vs redeemed codes
    await queryInterface.addIndex('gift_card_codes', ['is_redeemed']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gift_card_codes');
  },
};
