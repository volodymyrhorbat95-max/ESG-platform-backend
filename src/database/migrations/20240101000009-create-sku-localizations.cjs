'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sku_localizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sku_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skus',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the parent SKU',
      },
      locale: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Locale code (e.g., en-US, de-DE, fr-FR, it-IT)',
      },
      localized_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'SKU name in the local language',
      },
      localized_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'SKU description in the local language',
      },
      localized_terminology: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Local terminology (e.g., "plastic credit" vs "plastic offset")',
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
        comment: 'ISO 4217 currency code (EUR, USD, GBP, CHF, etc.)',
      },
      localized_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price in the local currency',
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

    // Composite unique index on sku_id and locale
    await queryInterface.addIndex('sku_localizations', ['sku_id', 'locale'], {
      unique: true,
      name: 'sku_locale_unique',
    });

    // Index for faster lookups by SKU
    await queryInterface.addIndex('sku_localizations', ['sku_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sku_localizations');
  },
};
