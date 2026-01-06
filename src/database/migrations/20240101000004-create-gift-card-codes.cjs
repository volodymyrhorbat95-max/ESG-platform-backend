'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gift_card_codes', {
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
      is_redeemed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      redeemed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      redeemed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('gift_card_codes', ['code'], { unique: true });
    await queryInterface.addIndex('gift_card_codes', ['sku_id']);
    await queryInterface.addIndex('gift_card_codes', ['is_redeemed']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gift_card_codes');
  },
};
