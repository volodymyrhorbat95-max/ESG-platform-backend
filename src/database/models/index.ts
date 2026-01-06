// Import sequelize instance
import { sequelize } from './sequelize.js';

// Import models
import User from './User.js';
import SKU, { PaymentMode } from './SKU.js';
import Merchant from './Merchant.js';
import Wallet from './Wallet.js';
import Transaction, { PaymentStatus } from './Transaction.js';
import GiftCardCode from './GiftCardCode.js';

// Define associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });

SKU.hasMany(Transaction, { foreignKey: 'skuId', as: 'transactions' });
SKU.hasMany(GiftCardCode, { foreignKey: 'skuId', as: 'giftCardCodes' });

Merchant.hasMany(Transaction, { foreignKey: 'merchantId', as: 'transactions' });
Merchant.hasOne(Wallet, { foreignKey: 'merchantId', as: 'wallet' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });
Transaction.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Transaction.belongsTo(GiftCardCode, { foreignKey: 'giftCardCodeId', as: 'giftCardCode' });

Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

GiftCardCode.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });
GiftCardCode.belongsTo(User, { foreignKey: 'redeemedBy', as: 'redeemer' });

// Export
export {
  sequelize,
  User,
  SKU,
  Merchant,
  Wallet,
  Transaction,
  GiftCardCode,
  PaymentMode,
  PaymentStatus,
};

export default {
  sequelize,
  User,
  SKU,
  Merchant,
  Wallet,
  Transaction,
  GiftCardCode,
};
