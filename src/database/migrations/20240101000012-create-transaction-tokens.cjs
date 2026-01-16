'use strict';

/**
 * TransactionToken Migration
 * Section 20.4: E-commerce Integration - Secure tokenized URLs for post-purchase access
 *
 * Purpose: Allow e-commerce customers to access their impact landing page
 * without logging in, using a secure token in the URL.
 *
 * Flow: E-commerce webhook → Create transaction → Generate token → Send URL to customer
 * Customer clicks URL → Token validated → Shows personalized impact page (no registration)
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_tokens');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('transaction_tokens', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        transaction_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'transactions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to the transaction this token provides access to',
        },
        token: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true,
          comment: 'Secure random token (32 bytes hex = 64 chars)',
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: '30 days from creation by default',
        },
        used_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when token was first used (for analytics)',
        },
        access_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of times the token has been used to access the page',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });
    }

    // Use IF NOT EXISTS for indexes to make migration idempotent
    // Note: unique constraint on 'token' column auto-creates an index

    // Index on transaction_id for finding tokens by transaction
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_transaction_tokens_transaction_id" ON "transaction_tokens" ("transaction_id");`
    );

    // Index on expires_at for cleanup queries
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_transaction_tokens_expires_at" ON "transaction_tokens" ("expires_at");`
    );

    console.log('✅ Created transaction_tokens table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transaction_tokens');
  }
};
