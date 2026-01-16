'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('merchants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      stripe_account_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Stripe Connect account ID for split payments - merchant receives (100% - platform fee)',
      },
      stripe_account_status: {
        type: Sequelize.ENUM('pending', 'active', 'restricted', 'disabled'),
        allowNull: true,
        defaultValue: null,
        comment: 'Stripe Connect account status - null if no account linked',
      },
      stripe_charges_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the Stripe account can accept charges',
      },
      stripe_payouts_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the Stripe account can receive payouts',
      },
      stripe_onboarding_complete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether merchant has completed Stripe Connect onboarding',
      },
      webhook_secret: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Secret key for verifying webhook signatures from merchant platform',
      },
      webhook_platform: {
        type: Sequelize.ENUM('WOOCOMMERCE', 'SHOPIFY', 'CUSTOM'),
        allowNull: true,
        comment: 'E-commerce platform type for webhook processing',
      },
      webhook_endpoint_url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Unique webhook URL for this merchant (for merchant reference)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex('merchants', ['email'], { unique: true });
    await queryInterface.addIndex('merchants', ['is_active']);
    await queryInterface.addIndex('merchants', ['stripe_account_status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('merchants');
    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_merchants_stripe_account_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_merchants_webhook_platform";');
  },
};
