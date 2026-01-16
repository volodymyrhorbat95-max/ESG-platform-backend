import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sequelize } from './database/models/index.js';

// Import middleware
import { corsOptions } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  helmetConfig,
  generalRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  csrfProtection,
  sanitizeInputs,
} from './middleware/security.js';

// Import routes
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import skuRoutes from './routes/sku.routes.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import giftCardRoutes from './routes/giftCard.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import exportRoutes from './routes/export.routes.js';
import merchantRoutes from './routes/merchant.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import qrcodeRoutes from './routes/qrcode.routes.js';
import configRoutes from './routes/config.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';

const app = express();

// Middleware - CORRECT ORDER IS CRITICAL
// Section 17.4: Security headers (helmet) must be first
app.use(helmetConfig);

// Section 17.4: CORS configuration
app.use(cors(corsOptions));

// CRITICAL: Webhook routes MUST be registered BEFORE express.json()
// Webhook signature verification requires raw request body

// Section 7.1: Stripe webhook
import paymentController from './controllers/payment.controller.js';
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

// Section 20.4: E-commerce webhooks (WooCommerce, Shopify, etc.)
import webhookController from './controllers/webhook.controller.js';
app.post('/api/webhooks/ecommerce/:merchantId', express.raw({ type: 'application/json' }), webhookController.handleEcommerceWebhook);

// Global JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Section 17.4: Input sanitization for XSS protection
app.use(sanitizeInputs);

// Section 17.4: CSRF protection for state-changing requests
app.use(csrfProtection);

// Section 17.4: General rate limiting for all API endpoints
app.use(generalRateLimiter);

// Section 18.3: Health check endpoint (basic)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Section 18.3: Detailed monitoring endpoint (for error logging and monitoring)
app.get('/health/detailed', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'unknown';
    let dbLatency = 0;
    try {
      const startTime = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - startTime;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    // System info
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    res.json({
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.nodeEnv,
      uptime: {
        seconds: Math.floor(uptimeSeconds),
        formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API Routes
// Section 17.4: Apply strict rate limiting to authentication endpoints
app.use('/api/admin', authRateLimiter, adminRoutes); // Admin authentication routes (login, verify, sku)
app.use('/api/auth', authRateLimiter, authRoutes); // User authentication routes (magic link, session)

// Section 17.4: Apply payment rate limiting to payment endpoints
app.use('/api/payments', paymentRateLimiter, paymentRoutes);

// Standard routes with general rate limiting (already applied globally)
app.use('/api', skuRoutes); // Contains /admin/skus and /impact routes
app.use('/api', userRoutes); // Contains /register and /users routes
app.use('/api', walletRoutes); // Contains /user/wallet and /merchant/wallet routes
app.use('/api', giftCardRoutes); // Contains /validate-code and /gift-cards routes
app.use('/api', exportRoutes); // Contains /admin/export routes
app.use('/api', merchantRoutes); // Contains /admin/merchants and /merchants/:id routes
app.use('/api/admin/partners', partnerRoutes); // Admin partner management routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes); // Legacy routes with IDs
app.use('/api', certificateRoutes); // Certificate generation routes
app.use('/api', qrcodeRoutes); // QR code generation routes for merchants
app.use('/api/config', configRoutes); // Global configuration management routes
app.use('/api/webhooks', webhookRoutes); // E-commerce webhook configuration routes (test, config)
app.use('/api/checkout', paymentRateLimiter, checkoutRoutes); // Section 1.2: E-commerce checkout with split payments

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Start Express server
    app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${env.frontend.url}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
