import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Wallet attributes interface
interface WalletAttributes {
  id: string;
  userId?: string;
  merchantId?: string;
  totalAccumulated: number;
  totalRedeemed: number;
  currentBalance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Wallet creation attributes
interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'createdAt' | 'updatedAt' | 'totalAccumulated' | 'totalRedeemed' | 'currentBalance'> {}

// Wallet model class
class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  declare id: string;
  declare userId?: string;
  declare merchantId?: string;
  declare totalAccumulated: number;
  declare totalRedeemed: number;
  declare currentBalance: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize Wallet model
Wallet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User wallet - one per user',
    },
    merchantId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Merchant wallet - one per merchant',
    },
    totalAccumulated: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total grams of plastic impact accumulated',
    },
    totalRedeemed: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total grams redeemed',
    },
    currentBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Current balance (totalAccumulated - totalRedeemed)',
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    validate: {
      eitherUserOrMerchant(this: Wallet) {
        // Use getDataValue to properly access field values in validation
        const userId = this.getDataValue('userId');
        const merchantId = this.getDataValue('merchantId');

        if (!userId && !merchantId) {
          throw new Error('Wallet must belong to either a user or a merchant');
        }
        if (userId && merchantId) {
          throw new Error('Wallet cannot belong to both a user and a merchant');
        }
      },
    },
  }
);

export default Wallet;
