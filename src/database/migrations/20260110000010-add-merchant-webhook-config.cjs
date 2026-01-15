/**
 * Migration: Add webhook configuration to merchants table
 * Section 20.4: WooCommerce/E-commerce Integration
 *
 * Adds fields for:
 * - Webhook secret for signature verification
 * - Webhook endpoint URL (for merchant reference)
 * - Webhook platform type (WooCommerce, Shopify, etc.)
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('merchants', 'webhook_secret', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Secret key for verifying webhook signatures from merchant platform',
    });

    await queryInterface.addColumn('merchants', 'webhook_platform', {
      type: Sequelize.ENUM('WOOCOMMERCE', 'SHOPIFY', 'CUSTOM'),
      allowNull: true,
      comment: 'E-commerce platform type for webhook processing',
    });

    await queryInterface.addColumn('merchants', 'webhook_endpoint_url', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Unique webhook URL for this merchant (for merchant reference)',
    });

    console.log('✅ Added webhook configuration columns to merchants table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('merchants', 'webhook_secret');
    await queryInterface.removeColumn('merchants', 'webhook_platform');
    await queryInterface.removeColumn('merchants', 'webhook_endpoint_url');

    // Drop ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_merchants_webhook_platform";');

    console.log('✅ Removed webhook configuration columns from merchants table');
  },
};
