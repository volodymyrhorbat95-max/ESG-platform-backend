'use strict';

/**
 * WalletAdjustment Migration
 * Section 9.4: Admin Panel - Manual wallet adjustments with audit trail
 *
 * Purpose: Track all manual wallet balance adjustments made by admins
 * for accountability, compliance, and user dispute resolution.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_adjustments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User whose wallet balance was manually adjusted',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Adjustment amount in grams (positive = add, negative = subtract)',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Admin notes explaining why the adjustment was made',
      },
      adjusted_by: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Admin user who made the adjustment (email or ID)',
      },
      adjusted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp when the adjustment was made',
      },
    });

    // Index on user_id for finding adjustments by user
    await queryInterface.addIndex('wallet_adjustments', ['user_id'], {
      name: 'idx_wallet_adjustments_user_id',
    });

    // Index on adjusted_at for time-based queries
    await queryInterface.addIndex('wallet_adjustments', ['adjusted_at'], {
      name: 'idx_wallet_adjustments_adjusted_at',
    });

    // Index on adjusted_by for admin activity tracking
    await queryInterface.addIndex('wallet_adjustments', ['adjusted_by'], {
      name: 'idx_wallet_adjustments_adjusted_by',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wallet_adjustments');
  },
};
