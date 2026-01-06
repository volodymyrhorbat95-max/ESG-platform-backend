import { Sequelize } from 'sequelize';
import { env } from '../../config/env.js';

// Create Sequelize instance
export const sequelize = new Sequelize({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  username: env.database.user,
  password: env.database.password,
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});
