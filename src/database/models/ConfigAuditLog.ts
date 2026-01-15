import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// ConfigAuditLog attributes interface
interface ConfigAuditLogAttributes {
  id: string;
  configKey: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string; // Admin who made the change
  changedAt: Date;
}

// ConfigAuditLog creation attributes
interface ConfigAuditLogCreationAttributes
  extends Optional<ConfigAuditLogAttributes, 'id' | 'changedAt'> {}

// ConfigAuditLog model class
class ConfigAuditLog extends Model<ConfigAuditLogAttributes, ConfigAuditLogCreationAttributes>
  implements ConfigAuditLogAttributes {
  declare id: string;
  declare configKey: string;
  declare oldValue: string | null;
  declare newValue: string;
  declare changedBy: string;
  declare readonly changedAt: Date;
}

// Initialize ConfigAuditLog model
ConfigAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    configKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Configuration key that was changed (e.g., CURRENT_CSR_PRICE)',
    },
    oldValue: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Previous value (null for new config)',
    },
    newValue: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'New value after change',
    },
    changedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Admin user who made the change (could store admin ID or email)',
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the change was made',
    },
  },
  {
    sequelize,
    tableName: 'config_audit_log',
    underscored: true,
    timestamps: false, // We're managing changedAt manually
  }
);

export default ConfigAuditLog;
