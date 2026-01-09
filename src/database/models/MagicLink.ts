import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';
import crypto from 'crypto';

// MagicLink attributes interface
interface MagicLinkAttributes {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// MagicLink creation attributes (optional fields)
interface MagicLinkCreationAttributes extends Optional<MagicLinkAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'usedAt'
> {}

// MagicLink model class
class MagicLink extends Model<MagicLinkAttributes, MagicLinkCreationAttributes> implements MagicLinkAttributes {
  declare id: string;
  declare userId: string;
  declare email: string;
  declare token: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Generate secure random token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Check if token is valid (not expired and not used)
  isValid(): boolean {
    if (this.usedAt) {
      return false; // Already used
    }
    if (this.expiresAt < new Date()) {
      return false; // Expired
    }
    return true;
  }

  // Mark token as used
  async markAsUsed(): Promise<void> {
    this.usedAt = new Date();
    await this.save();
  }
}

// Initialize MagicLink model
MagicLink.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'MagicLink',
    tableName: 'magic_links',
    timestamps: true,
    indexes: [
      {
        fields: ['token'],
        unique: true,
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['email'],
      },
    ],
  }
);

export default MagicLink;
