'use strict';

/**
 * Migration: Add productWeight and description fields to SKUs table
 * Section 5.1 Requirements:
 * - productWeight: Actual grams for physical products (e.g., 17g pasta, 170g for 10x campaign)
 * - description: Merchant-facing description of the SKU
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add product_weight column
    await queryInterface.addColumn('skus', 'product_weight', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Section 5.1: Actual grams for physical products (e.g., 17g pasta, 170g for 10x campaign)',
    });

    // Add description column
    await queryInterface.addColumn('skus', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Section 5.1: Merchant-facing description of the SKU',
    });
  },

  async down(queryInterface) {
    // Remove the columns if rolling back
    await queryInterface.removeColumn('skus', 'product_weight');
    await queryInterface.removeColumn('skus', 'description');
  },
};
