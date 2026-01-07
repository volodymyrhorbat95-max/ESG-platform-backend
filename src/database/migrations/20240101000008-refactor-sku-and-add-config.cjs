'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create global_config table
    await queryInterface.createTable('global_config', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // 2. Insert initial CURRENT_CSR_PRICE
    await queryInterface.bulkInsert('global_config', [
      {
        id: uuidv4(),
        key: 'CURRENT_CSR_PRICE',
        value: '0.11',
        description: 'Current price per kg of plastic removed (in EUR). Used for dynamic impact calculation.',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Rename amplivoThreshold to corsairThreshold in SKUs table
    await queryInterface.renameColumn('skus', 'amplivo_threshold', 'corsair_threshold');

    // 4. Remove gramsWeight column from SKUs table
    // (Impact is now calculated dynamically based on price ÷ CURRENT_CSR_PRICE)
    await queryInterface.removeColumn('skus', 'grams_weight');

    // 5. Add corsairConnectFlag to transactions table
    await queryInterface.addColumn('transactions', 'corsair_connect_flag', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True if transaction amount >= corsairThreshold (triggers Corsair Connect account)',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove corsairConnectFlag from transactions
    await queryInterface.removeColumn('transactions', 'corsair_connect_flag');

    // Add back gramsWeight to SKUs
    await queryInterface.addColumn('skus', 'grams_weight', {
      type: Sequelize.INTEGER,
      allowNull: true, // Nullable during rollback
    });

    // Rename back corsairThreshold to amplivoThreshold
    await queryInterface.renameColumn('skus', 'corsair_threshold', 'amplivo_threshold');

    // Drop global_config table
    await queryInterface.dropTable('global_config');
  },
};
