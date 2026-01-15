import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Type-safe environment variable access
interface EnvConfig {
  port: number;
  nodeEnv: string;
  backendUrl: string;
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
  admin: {
    sku: string;
    secretCode: string;
  };
  email: {
    resendApiKey?: string;
    fromEmail: string;
  };
}

// Validate and export environment variables
const validateEnv = (): EnvConfig => {
  const requiredVars = [
    'PORT',
    'BACKEND_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FRONTEND_URL',
    'JWT_SECRET',
    'ADMIN_SKU',
    'ADMIN_SECRET_CODE',
    'FROM_EMAIL'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    port: parseInt(process.env.PORT!, 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    backendUrl: process.env.BACKEND_URL!,
    database: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
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
    admin: {
      sku: process.env.ADMIN_SKU!,
      secretCode: process.env.ADMIN_SECRET_CODE!,
    },
    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL!,
    },
  };
};

export const env = validateEnv();
