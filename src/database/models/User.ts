import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// User attributes interface
interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
  termsAcceptedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes (optional fields)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'state'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare dateOfBirth: Date;
  declare street: string;
  declare city: string;
  declare postalCode: string;
  declare country: string;
  declare state: string;
  declare termsAcceptedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Initialize User model
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
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
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;
