import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Type-safe environment variable access
interface EnvConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  frontend: {
    url: string;
  };
  jwt: {
    secret: string;
  };
}

// Validate and export environment variables
const validateEnv = (): EnvConfig => {
  const requiredVars = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'JWT_SECRET'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    },
    frontend: {
      url: process.env.FRONTEND_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
  };
};

export const env = validateEnv();
