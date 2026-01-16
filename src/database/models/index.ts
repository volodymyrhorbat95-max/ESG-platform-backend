// Import sequelize instance
import { sequelize } from './sequelize.js';

// Import models
import User from './User.js';
import SKU, { PaymentMode } from './SKU.js';
import Merchant from './Merchant.js';
import Partner from './Partner.js';
import Wallet from './Wallet.js';
import Transaction, { PaymentStatus } from './Transaction.js';
import GiftCardCode from './GiftCardCode.js';
import SKULocalization from './SKULocalization.js';
import ShareableLink from './ShareableLink.js';
import GlobalConfig from './GlobalConfig.js';
import MagicLink from './MagicLink.js';
import ConfigAuditLog from './ConfigAuditLog.js';
import WalletAdjustment from './WalletAdjustment.js';
import TransactionToken from './TransactionToken.js';

// Define associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
User.hasMany(ShareableLink, { foreignKey: 'userId', as: 'shareableLinks' });
User.hasMany(MagicLink, { foreignKey: 'userId', as: 'magicLinks' });
User.hasMany(WalletAdjustment, { foreignKey: 'userId', as: 'walletAdjustments' });

SKU.hasMany(Transaction, { foreignKey: 'skuId', as: 'transactions' });
SKU.hasMany(GiftCardCode, { foreignKey: 'skuId', as: 'giftCardCodes' });
SKU.hasMany(SKULocalization, { foreignKey: 'skuId', as: 'localizations' });

SKULocalization.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });
ShareableLink.belongsTo(User, { foreignKey: 'userId', as: 'user' });
MagicLink.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Merchant.hasMany(Transaction, { foreignKey: 'merchantId', as: 'transactions' });
Merchant.hasOne(Wallet, { foreignKey: 'merchantId', as: 'wallet' });

Partner.hasMany(Transaction, { foreignKey: 'partnerId', as: 'transactions' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });
Transaction.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Transaction.belongsTo(Partner, { foreignKey: 'partnerId', as: 'partner' });
Transaction.belongsTo(GiftCardCode, { foreignKey: 'giftCardCodeId', as: 'giftCardCode' });
Transaction.hasMany(TransactionToken, { foreignKey: 'transactionId', as: 'tokens' });

TransactionToken.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

GiftCardCode.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });
GiftCardCode.belongsTo(User, { foreignKey: 'redeemedBy', as: 'redeemer' });

WalletAdjustment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export
export {
  sequelize,
  User,
  SKU,
  Merchant,
  Partner,
  Wallet,
  Transaction,
  GiftCardCode,
  SKULocalization,
  ShareableLink,
  GlobalConfig,
  MagicLink,
  ConfigAuditLog,
  WalletAdjustment,
  TransactionToken,
  PaymentMode,
  PaymentStatus,
};

export default {
  sequelize,
  User,
  SKU,
  Merchant,
  Partner,
  Wallet,
  Transaction,
  GiftCardCode,
  SKULocalization,
  ShareableLink,
  GlobalConfig,
  MagicLink,
  ConfigAuditLog,
  WalletAdjustment,
  TransactionToken,
};
