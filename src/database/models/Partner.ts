import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Partner attributes interface
interface PartnerAttributes {
  id: string;
  name: string;
  email: string;
  contactPerson: string;
  phone?: string;
  billingAddress?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Partner creation attributes
interface PartnerCreationAttributes extends Optional<PartnerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'phone' | 'billingAddress' | 'isActive'> {}

// Partner model class
class Partner extends Model<PartnerAttributes, PartnerCreationAttributes> implements PartnerAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare contactPerson: string;
  declare phone?: string;
  declare billingAddress?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize Partner model
Partner.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'partners',
  }
);

export default Partner;
