import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NA = 'n/a', // For CLAIM and ALLOCATION types
}

// Transaction attributes interface
interface TransactionAttributes {
  id: string;
  userId: string;
  skuId: string;
  masterId: string; // Marcello's Master ID - for overall network tracking
  merchantId?: string;
  partnerId?: string;
  orderId?: string;
  amount: number;
  calculatedImpact: number;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  giftCardCodeId?: string;
  corsairConnectFlag: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Transaction creation attributes
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'corsairConnectFlag'> {}

// Transaction model class
class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  declare id: string;
  declare userId: string;
  declare skuId: string;
  declare masterId: string;
  declare merchantId?: string;
  declare partnerId?: string;
  declare orderId?: string;
  declare amount: number;
  declare calculatedImpact: number;
  declare paymentStatus: PaymentStatus;
  declare stripePaymentIntentId?: string;
  declare giftCardCodeId?: string;
  declare corsairConnectFlag: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association properties (added by Sequelize)
  declare readonly user?: any;
  declare readonly sku?: any;
  declare readonly merchant?: any;
}

// Initialize Transaction model
Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to user who made the transaction',
    },
    skuId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to SKU',
    },
    masterId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Marcello Master ID - for overall network tracking and attribution',
    },
    merchantId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to merchant (if applicable)',
    },
    partnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Partner attribution for monthly invoicing',
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External order reference from partner systems',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      comment: 'Transaction amount in euros (4 decimals for precision)',
    },
    calculatedImpact: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Calculated plastic impact in grams (amount / CURRENT_CSR_PRICE * 1000)',
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe payment intent ID (for PAY type)',
    },
    giftCardCodeId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to redeemed gift card code (for GIFT_CARD type)',
    },
    corsairConnectFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True if transaction amount >= corsairThreshold (triggers Corsair Connect account)',
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    underscored: true,
  }
);

export default Transaction;
