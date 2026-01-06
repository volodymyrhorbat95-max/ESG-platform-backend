'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
      },
      merchant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      calculated_impact: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'n/a'),
        allowNull: false,
        defaultValue: 'pending',
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gift_card_code_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'gift_card_codes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amplivo_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['sku_id']);
    await queryInterface.addIndex('transactions', ['merchant_id']);
    await queryInterface.addIndex('transactions', ['partner_id']);
    await queryInterface.addIndex('transactions', ['payment_status']);
    await queryInterface.addIndex('transactions', ['amplivo_flag']);
    await queryInterface.addIndex('transactions', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  },
};
