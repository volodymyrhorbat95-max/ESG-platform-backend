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
  merchantId?: string;
  partnerId?: string;
  orderId?: string;
  amount: number;
  calculatedImpact: number;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId?: string;
  giftCardCodeId?: string;
  amplivoFlag: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Transaction creation attributes
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'amplivoFlag'> {}

// Transaction model class
class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public userId!: string;
  public skuId!: string;
  public merchantId?: string;
  public partnerId?: string;
  public orderId?: string;
  public amount!: number;
  public calculatedImpact!: number;
  public paymentStatus!: PaymentStatus;
  public stripePaymentIntentId?: string;
  public giftCardCodeId?: string;
  public amplivoFlag!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties (added by Sequelize)
  public readonly user?: any;
  public readonly sku?: any;
  public readonly merchant?: any;
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Transaction amount in euros',
    },
    calculatedImpact: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Calculated plastic impact in grams',
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
    amplivoFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True if transaction exceeds Amplivo threshold',
    },
  },
  {
    sequelize,
    tableName: 'transactions',
  }
);

export default Transaction;
