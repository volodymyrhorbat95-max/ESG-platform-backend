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
// CRITICAL: gramsWeight REMOVED - impact is calculated dynamically as (amount ÷ CURRENT_CSR_PRICE)
// CRITICAL: amplivoThreshold RENAMED to corsairThreshold (service name changed)
// Section 5.1: Added productWeight and description fields per requirements
interface SKUAttributes {
  id: string;
  code: string;
  name: string;
  price: number;
  paymentMode: PaymentMode;
  requiresValidation: boolean;
  corsairThreshold: number;
  impactMultiplier: number;
  productWeight?: number; // Section 5.1: Actual grams for physical products (e.g., 17g for pasta)
  description?: string; // Section 5.1: Merchant-facing description
  partnerId?: string;
  merchantId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// SKU creation attributes
interface SKUCreationAttributes extends Optional<SKUAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

// SKU model class
class SKU extends Model<SKUAttributes, SKUCreationAttributes> implements SKUAttributes {
  declare id: string;
  declare code: string;
  declare name: string;
  declare price: number;
  declare paymentMode: PaymentMode;
  declare requiresValidation: boolean;
  declare corsairThreshold: number;
  declare impactMultiplier: number;
  declare productWeight?: number;
  declare description?: string;
  declare partnerId?: string;
  declare merchantId?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
      comment: 'SKU code used in URLs (e.g., LOT-01, PASTA-01, GC-25EUR, ALLOC-MERCHANT-5)',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      comment: 'Price in euros. Impact = price / CURRENT_CSR_PRICE. Use 4 decimals for small amounts like 0.0187',
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
      comment: 'True for GIFT_CARD type (secret code validation required)',
    },
    corsairThreshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 10.00,
      comment: 'Flag transaction for Corsair Connect if amount >= this value (triggers account creation)',
    },
    impactMultiplier: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.0,
      comment: 'Multiplier for ALLOCATION type (e.g., 1.6 for amount × 1.6). Standard flows use CURRENT_CSR_PRICE.',
    },
    productWeight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Section 5.1: Actual grams for physical products (e.g., 17g pasta, 170g for 10x campaign)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Section 5.1: Merchant-facing description of the SKU',
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Optional partner association for ALLOCATION flow',
    },
    merchantId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Optional merchant that owns this SKU',
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
    underscored: true,
  }
);

export default SKU;
