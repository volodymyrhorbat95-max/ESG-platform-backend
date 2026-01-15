'use strict';

/**
 * Migration: Add totalAmountSpent and certifiedAssetStatus fields to Wallets table
 * Section 6 Requirements:
 * - totalAmountSpent: Track cumulative euros spent to determine €10 threshold
 * - certifiedAssetStatus: Boolean flag indicating if user has reached certified asset status
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add total_amount_spent column
    await queryInterface.addColumn('wallets', 'total_amount_spent', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Section 6.1: Total euros spent across all transactions (for €10 threshold tracking)',
    });

    // Add certified_asset_status column
    await queryInterface.addColumn('wallets', 'certified_asset_status', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Section 6.2: True if totalAmountSpent >= CORSAIR_THRESHOLD (certified asset unlocked)',
    });
  },

  async down(queryInterface) {
    // Remove the columns if rolling back
    await queryInterface.removeColumn('wallets', 'total_amount_spent');
    await queryInterface.removeColumn('wallets', 'certified_asset_status');
  },
};
