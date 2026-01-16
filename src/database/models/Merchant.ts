import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Webhook platform types
export type WebhookPlatform = 'WOOCOMMERCE' | 'SHOPIFY' | 'CUSTOM';

// Stripe Connect account status types
export type StripeAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

// Merchant attributes interface
interface MerchantAttributes {
  id: string;
  name: string;
  email: string;
  stripeAccountId?: string;
  stripeAccountStatus?: StripeAccountStatus;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeOnboardingComplete: boolean;
  webhookSecret?: string;
  webhookPlatform?: WebhookPlatform;
  webhookEndpointUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Merchant creation attributes
interface MerchantCreationAttributes extends Optional<MerchantAttributes, 'id' | 'createdAt' | 'updatedAt' | 'stripeAccountId' | 'stripeAccountStatus' | 'stripeChargesEnabled' | 'stripePayoutsEnabled' | 'stripeOnboardingComplete' | 'webhookSecret' | 'webhookPlatform' | 'webhookEndpointUrl' | 'isActive'> {}

// Merchant model class
class Merchant extends Model<MerchantAttributes, MerchantCreationAttributes> implements MerchantAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare stripeAccountId?: string;
  declare stripeAccountStatus?: StripeAccountStatus;
  declare stripeChargesEnabled: boolean;
  declare stripePayoutsEnabled: boolean;
  declare stripeOnboardingComplete: boolean;
  declare webhookSecret?: string;
  declare webhookPlatform?: WebhookPlatform;
  declare webhookEndpointUrl?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Helper method to check if merchant can receive split payments
  canReceivePayments(): boolean {
    return !!(
      this.stripeAccountId &&
      this.stripeChargesEnabled &&
      this.stripeOnboardingComplete
    );
  }
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
    stripeAccountStatus: {
      type: DataTypes.ENUM('pending', 'active', 'restricted', 'disabled'),
      allowNull: true,
      comment: 'Stripe Connect account status - null if no account linked',
    },
    stripeChargesEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the Stripe account can accept charges',
    },
    stripePayoutsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the Stripe account can receive payouts',
    },
    stripeOnboardingComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether merchant has completed Stripe Connect onboarding',
    },
    webhookSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Secret key for verifying webhook signatures from merchant platform',
    },
    webhookPlatform: {
      type: DataTypes.ENUM('WOOCOMMERCE', 'SHOPIFY', 'CUSTOM'),
      allowNull: true,
      comment: 'E-commerce platform type for webhook processing',
    },
    webhookEndpointUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique webhook URL for this merchant',
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
    underscored: true,
  }
);

export default Merchant;
