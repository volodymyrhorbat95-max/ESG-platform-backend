import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Payment mode enum - supports all 4 business models
export enum PaymentMode {
  CLAIM = 'CLAIM',           // Type 1: Prepaid Lot
  PAY = 'PAY',              // Type 2: Pay-as-you-go
  GIFT_CARD = 'GIFT_CARD',  // Type 3: Gift Card
  ALLOCATION = 'ALLOCATION'  // Type 4: Environmental Allocation
}

// SKU attributes interface
interface SKUAttributes {
  id: string;
  code: string;
  name: string;
  gramsWeight: number;
  price: number;
  paymentMode: PaymentMode;
  requiresValidation: boolean;
  amplivoThreshold: number;
  impactMultiplier: number;
  partnerId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// SKU creation attributes
interface SKUCreationAttributes extends Optional<SKUAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

// SKU model class
class SKU extends Model<SKUAttributes, SKUCreationAttributes> implements SKUAttributes {
  public id!: string;
  public code!: string;
  public name!: string;
  public gramsWeight!: number;
  public price!: number;
  public paymentMode!: PaymentMode;
  public requiresValidation!: boolean;
  public amplivoThreshold!: number;
  public impactMultiplier!: number;
  public partnerId?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize SKU model
SKU.init(
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
      comment: 'SKU code used in URLs (e.g., LOT-01, PASTA-01, GC-25, ACC-01)',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gramsWeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Plastic impact in grams (for fixed-weight SKUs)',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price in euros (0 for CLAIM type)',
    },
    paymentMode: {
      type: DataTypes.ENUM(...Object.values(PaymentMode)),
      allowNull: false,
      comment: 'Determines transaction flow: CLAIM, PAY, GIFT_CARD, or ALLOCATION',
    },
    requiresValidation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True for GIFT_CARD type (secret code validation)',
    },
    amplivoThreshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10.00,
      comment: 'Flag transaction for Amplivo if amount exceeds this value',
    },
    impactMultiplier: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.0,
      comment: 'Multiplier for ALLOCATION type (e.g., 1.6 for amount × 1.6)',
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Optional partner association',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'skus',
  }
);

export default SKU;
