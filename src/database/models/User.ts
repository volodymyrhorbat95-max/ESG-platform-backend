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
  state: string;
  termsAcceptedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes (optional fields)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public dateOfBirth!: Date;
  public street!: string;
  public city!: string;
  public postalCode!: string;
  public country!: string;
  public state!: string;
  public termsAcceptedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
      allowNull: false,
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
