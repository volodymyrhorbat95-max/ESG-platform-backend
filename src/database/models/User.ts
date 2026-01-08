import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './sequelize.js';

// Registration level types
export type RegistrationLevel = 'minimal' | 'standard' | 'full';

// User attributes interface
interface UserAttributes {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  state?: string | null;
  registrationLevel: RegistrationLevel;
  corsairConnectFlag: boolean;
  termsAcceptedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes (optional fields)
interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'dateOfBirth' |
  'street' | 'city' | 'postalCode' | 'country' | 'state' | 'termsAcceptedAt' |
  'registrationLevel' | 'corsairConnectFlag'
> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare firstName: string | null;
  declare lastName: string | null;
  declare dateOfBirth: Date | null;
  declare street: string | null;
  declare city: string | null;
  declare postalCode: string | null;
  declare country: string | null;
  declare state: string | null;
  declare registrationLevel: RegistrationLevel;
  declare corsairConnectFlag: boolean;
  declare termsAcceptedAt: Date | null;
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registrationLevel: {
      type: DataTypes.ENUM('minimal', 'standard', 'full'),
      allowNull: false,
      defaultValue: 'minimal',
    },
    corsairConnectFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;
