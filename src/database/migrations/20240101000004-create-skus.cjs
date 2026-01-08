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
        comment: 'SKU code used in URLs (e.g., LOT-01, GC-25EUR, ALLOC-MERCHANT-5)',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Price in euros. Impact = price / CURRENT_CSR_PRICE. Use 4 decimals for small amounts like 0.0187',
      },
      payment_mode: {
        type: Sequelize.ENUM('CLAIM', 'PAY', 'GIFT_CARD', 'ALLOCATION'),
        allowNull: false,
        comment: 'CLAIM=prepaid, PAY=Stripe, GIFT_CARD=secret code, ALLOCATION=URL amount',
      },
      requires_validation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'True for GIFT_CARD type (secret code validation required)',
      },
      corsair_threshold: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 10.00,
        comment: 'Amount threshold for Corsair Connect account (default 10 euros)',
      },
      impact_multiplier: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: 'Multiplier for impact calculation. 1=normal, 10=10X campaign',
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'partners',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Partner association for ALLOCATION flow',
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
        comment: 'Merchant that owns this SKU',
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
    await queryInterface.addIndex('skus', ['merchant_id']);
    await queryInterface.addIndex('skus', ['partner_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('skus');
  },
};
