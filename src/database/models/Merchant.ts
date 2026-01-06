import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Merchant attributes interface
interface MerchantAttributes {
  id: string;
  name: string;
  email: string;
  stripeAccountId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Merchant creation attributes
interface MerchantCreationAttributes extends Optional<MerchantAttributes, 'id' | 'createdAt' | 'updatedAt' | 'stripeAccountId' | 'isActive'> {}

// Merchant model class
class Merchant extends Model<MerchantAttributes, MerchantCreationAttributes> implements MerchantAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public stripeAccountId?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Merchant model
Merchant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    stripeAccountId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe Connect account ID for split payments',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'merchants',
  }
);

export default Merchant;
