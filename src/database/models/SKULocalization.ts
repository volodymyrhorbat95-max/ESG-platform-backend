import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// SKU Localization attributes interface for multi-market support
interface SKULocalizationAttributes {
  id: string;
  skuId: string;
  locale: string;
  localizedName: string;
  localizedDescription?: string;
  localizedTerminology?: string;
  currency: string;
  localizedPrice: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// SKU Localization creation attributes
interface SKULocalizationCreationAttributes extends Optional<SKULocalizationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'localizedDescription' | 'localizedTerminology'> {}

// SKU Localization model class
class SKULocalization extends Model<SKULocalizationAttributes, SKULocalizationCreationAttributes> implements SKULocalizationAttributes {
  declare id: string;
  declare skuId: string;
  declare locale: string;
  declare localizedName: string;
  declare localizedDescription: string;
  declare localizedTerminology: string;
  declare currency: string;
  declare localizedPrice: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize SKU Localization model
SKULocalization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    skuId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to the parent SKU',
    },
    locale: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Locale code (e.g., en-US, de-DE, fr-FR, it-IT)',
    },
    localizedName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'SKU name in the local language',
    },
    localizedDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SKU description in the local language',
    },
    localizedTerminology: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Local terminology (e.g., "plastic credit" vs "plastic offset")',
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'EUR',
      comment: 'ISO 4217 currency code (EUR, USD, GBP, CHF, etc.)',
    },
    localizedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price in the local currency',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'sku_localizations',
    indexes: [
      {
        unique: true,
        fields: ['skuId', 'locale'],
        name: 'sku_locale_unique',
      },
    ],
  }
);

export default SKULocalization;
