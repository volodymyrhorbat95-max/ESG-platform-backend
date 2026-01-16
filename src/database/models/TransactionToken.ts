// TransactionToken Model
// Section 20.4: E-commerce Integration - Secure tokenized URLs for post-purchase access
//
// Purpose: Allow e-commerce customers to access their impact landing page
// without logging in, using a secure token in the URL.
//
// Flow:
// 1. E-commerce webhook creates transaction
// 2. System generates TransactionToken with secure random token
// 3. Customer receives URL: /landing?txn={transactionId}&token={token}
// 4. Frontend fetches transaction via token (no auth required)
// 5. Displays personalized "Thank you" page with impact

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// TransactionToken attributes interface
interface TransactionTokenAttributes {
  id: string;
  transactionId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  accessCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes (optional fields)
interface TransactionTokenCreationAttributes
  extends Optional<TransactionTokenAttributes, 'id' | 'usedAt' | 'accessCount' | 'createdAt' | 'updatedAt'> {}

// TransactionToken model class
class TransactionToken
  extends Model<TransactionTokenAttributes, TransactionTokenCreationAttributes>
  implements TransactionTokenAttributes
{
  declare id: string;
  declare transactionId: string;
  declare token: string;
  declare expiresAt: Date;
  declare usedAt?: Date;
  declare accessCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association properties (added by Sequelize)
  declare readonly transaction?: any;

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token is valid (exists and not expired)
   */
  isValid(): boolean {
    return !this.isExpired();
  }
}

// Initialize TransactionToken model
TransactionToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to the transaction this token provides access to',
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'Secure random token (32 bytes hex = 64 chars)',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '30 days from creation by default',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when token was first used (for analytics)',
    },
    accessCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times the token has been used to access the page',
    },
  },
  {
    sequelize,
    tableName: 'transaction_tokens',
    underscored: true,
  }
);

export default TransactionToken;
