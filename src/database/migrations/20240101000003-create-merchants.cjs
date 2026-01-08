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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('merchants');
  },
};
