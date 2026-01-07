import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// GlobalConfig attributes interface
interface GlobalConfigAttributes {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// GlobalConfig creation attributes
interface GlobalConfigCreationAttributes
  extends Optional<GlobalConfigAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

// GlobalConfig model class
class GlobalConfig extends Model<GlobalConfigAttributes, GlobalConfigCreationAttributes>
  implements GlobalConfigAttributes {
  declare id: string;
  declare key: string;
  declare value: string;
  declare description?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize GlobalConfig model
GlobalConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Configuration key (e.g., CURRENT_CSR_PRICE)',
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Configuration value (stored as string, parse as needed)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this config controls',
    },
  },
  {
    sequelize,
    tableName: 'global_config',
    underscored: true,
  }
);

export default GlobalConfig;
