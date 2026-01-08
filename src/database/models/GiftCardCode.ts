import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Gift Card Code attributes interface
interface GiftCardCodeAttributes {
  id: string;
  code: string;
  skuId: string;
  isRedeemed: boolean;
  redeemedAt?: Date;
  redeemedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Gift Card Code creation attributes
interface GiftCardCodeCreationAttributes extends Optional<GiftCardCodeAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isRedeemed' | 'redeemedAt' | 'redeemedBy'> {}

// Gift Card Code model class
class GiftCardCode extends Model<GiftCardCodeAttributes, GiftCardCodeCreationAttributes> implements GiftCardCodeAttributes {
  declare id: string;
  declare code: string;
  declare skuId: string;
  declare isRedeemed: boolean;
  declare redeemedAt?: Date;
  declare redeemedBy?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize Gift Card Code model
GiftCardCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Secret code for gift card validation',
    },
    skuId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to gift card SKU',
    },
    isRedeemed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'One-time use enforcement',
    },
    redeemedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when code was redeemed',
    },
    redeemedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who redeemed the code',
    },
  },
  {
    sequelize,
    tableName: 'gift_card_codes',
    underscored: true,
  }
);

export default GiftCardCode;
