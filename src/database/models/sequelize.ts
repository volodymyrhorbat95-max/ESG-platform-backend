import { Sequelize } from 'sequelize';
import { env } from '../../config/env.js';

// Section 19.2: Database connection pool configuration
// Supports 100+ concurrent transactions with optimized pool settings
export const sequelize = new Sequelize({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  username: env.database.user,
  password: env.database.password,
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    // Section 19.2: Increased pool size for high concurrency
    max: 20, // Maximum 20 connections for 100+ concurrent transactions
    min: 5, // Keep 5 connections warm for fast response times
    acquire: 30000, // Max time to get connection before error (30s)
    idle: 10000, // Release connection after 10s idle
    evict: 1000, // Check for idle connections every 1s
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  // Section 19.1: Query optimization for faster API responses
  dialectOptions: {
    // Enable statement timeout for long-running queries (5 seconds)
    statement_timeout: 5000,
    // Enable query timeout
    query_timeout: 5000,
  },
  // Retry logic for transient connection errors
  retry: {
    max: 3,
  },
});
