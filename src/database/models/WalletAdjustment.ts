import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// WalletAdjustment attributes interface
interface WalletAdjustmentAttributes {
  id: string;
  userId: string; // User whose wallet was adjusted
  amount: number; // Adjustment amount (can be negative for deductions)
  reason: string; // Admin notes explaining the adjustment
  adjustedBy: string; // Admin who made the adjustment
  adjustedAt: Date;
}

// WalletAdjustment creation attributes
interface WalletAdjustmentCreationAttributes
  extends Optional<WalletAdjustmentAttributes, 'id' | 'adjustedAt'> {}

// WalletAdjustment model class
class WalletAdjustment extends Model<WalletAdjustmentAttributes, WalletAdjustmentCreationAttributes>
  implements WalletAdjustmentAttributes {
  declare id: string;
  declare userId: string;
  declare amount: number;
  declare reason: string;
  declare adjustedBy: string;
  declare readonly adjustedAt: Date;
}

// Initialize WalletAdjustment model
WalletAdjustment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User whose wallet balance was manually adjusted',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Adjustment amount in grams (positive = add, negative = subtract)',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Admin notes explaining why the adjustment was made',
    },
    adjustedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Admin user who made the adjustment (email or ID)',
    },
    adjustedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the adjustment was made',
    },
  },
  {
    sequelize,
    tableName: 'wallet_adjustments',
    underscored: true,
    timestamps: false, // We're managing adjustedAt manually
  }
);

export default WalletAdjustment;
