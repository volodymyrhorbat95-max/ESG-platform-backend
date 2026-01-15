/**
 * Security Middleware - Section 17.4 Compliance
 * Implements helmet, rate limiting, and other security best practices
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Configure helmet for HTTP security headers
 * Section 17.4: XSS Protection, HTTPS enforcement, content security
 */
export const helmetConfig = helmet({
  // Content Security Policy - prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
    },
  },
  // Strict Transport Security - enforces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options - prevents clickjacking
  frameguard: {
    action: 'deny',
  },
  // X-Content-Type-Options - prevents MIME sniffing
  noSniff: true,
  // X-XSS-Protection - enables browser XSS filter
  xssFilter: true,
  // Referrer-Policy - controls referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Rate limiting for general API endpoints
 * Section 17.4: Rate limiting on API endpoints
 * Allows 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoint
  skip: (req) => req.path === '/health',
});

/**
 * Strict rate limiting for authentication endpoints
 * Section 17.4: Prevents brute force attacks on auth endpoints
 * Allows 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiting for payment endpoints
 * Section 17.4: Prevents payment abuse
 * Allows 10 requests per 15 minutes per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CSRF Token Validation Middleware
 * Section 17.4: CSRF protection
 *
 * For stateless JWT authentication, we use custom header validation
 * instead of traditional CSRF tokens
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (validated by webhook signature)
  if (req.path === '/api/payments/webhook') {
    return next();
  }

  // Skip CSRF for e-commerce webhooks (validated by platform-specific signature)
  if (req.path.startsWith('/api/webhooks/ecommerce/')) {
    return next();
  }

  // Validate custom header for AJAX requests
  const customHeader = req.get('X-Requested-With');
  const origin = req.get('Origin');
  const referer = req.get('Referer');

  // For API calls, verify they come from our frontend
  if (customHeader === 'XMLHttpRequest' ||
      (origin && origin.includes(process.env.FRONTEND_URL || '')) ||
      (referer && referer.includes(process.env.FRONTEND_URL || ''))) {
    return next();
  }

  // For content-type application/json, assume it's from our frontend
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return next();
  }

  // If none of the above, reject the request
  res.status(403).json({
    success: false,
    error: 'CSRF validation failed',
  });
};

/**
 * Input sanitization middleware
 * Section 17.4: XSS Protection - sanitize user inputs
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize all string inputs in request body
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};
