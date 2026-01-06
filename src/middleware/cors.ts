import { CorsOptions } from 'cors';
import { env } from '../config/env.js';

/**
 * CORS configuration for frontend access
 * Allows requests from frontend URL specified in environment variables
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests from frontend URL
    const allowedOrigins = [env.frontend.url];

    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && env.nodeEnv === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};
