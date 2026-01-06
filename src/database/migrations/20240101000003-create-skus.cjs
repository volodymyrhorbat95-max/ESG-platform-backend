'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skus', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      grams_weight: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_mode: {
        type: Sequelize.ENUM('CLAIM', 'PAY', 'GIFT_CARD', 'ALLOCATION'),
        allowNull: false,
      },
      requires_validation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      amplivo_threshold: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10.00,
      },
      impact_multiplier: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
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

    await queryInterface.addIndex('skus', ['code'], { unique: true });
    await queryInterface.addIndex('skus', ['payment_mode']);
    await queryInterface.addIndex('skus', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('skus');
  },
};
