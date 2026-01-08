import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';
import crypto from 'crypto';

// Shareable Link attributes interface for secure dashboard sharing
interface ShareableLinkAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt?: Date;
  isPublic: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Shareable Link creation attributes
interface ShareableLinkCreationAttributes extends Optional<ShareableLinkAttributes, 'id' | 'token' | 'createdAt' | 'updatedAt' | 'viewCount' | 'lastViewedAt' | 'expiresAt' | 'isPublic'> {}

// Shareable Link model class
class ShareableLink extends Model<ShareableLinkAttributes, ShareableLinkCreationAttributes> implements ShareableLinkAttributes {
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare isPublic: boolean;
  declare viewCount: number;
  declare lastViewedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Check if link is valid (not expired)
  isValid(): boolean {
    if (!this.expiresAt) return true; // No expiry = always valid
    return new Date() < this.expiresAt;
  }

  // Generate a new secure token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Initialize Shareable Link model
ShareableLink.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'The user whose dashboard this link shares',
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'Secure random token for URL (e.g., /share/abc123...)',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional expiration date (null = never expires)',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'If false, link requires authentication',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times this link has been viewed',
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of last view',
    },
  },
  {
    sequelize,
    tableName: 'shareable_links',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['token'],
        name: 'shareable_link_token_unique',
      },
      {
        fields: ['user_id'],
        name: 'shareable_link_user_idx',
      },
    ],
    hooks: {
      beforeCreate: (link) => {
        if (!link.token) {
          link.token = ShareableLink.generateToken();
        }
      },
    },
  }
);

export default ShareableLink;
