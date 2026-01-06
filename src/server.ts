import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sequelize } from './database/models/index.js';

// Import middleware
import { corsOptions } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import skuRoutes from './routes/sku.routes.js';
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import giftCardRoutes from './routes/giftCard.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import exportRoutes from './routes/export.routes.js';

const app = express();

// Middleware - CORRECT ORDER IS CRITICAL
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', skuRoutes); // Contains /admin/skus and /impact routes
app.use('/api', userRoutes); // Contains /register and /users routes
app.use('/api', walletRoutes); // Contains /user/wallet and /merchant/wallet routes
app.use('/api', giftCardRoutes); // Contains /validate-code and /gift-cards routes
app.use('/api', exportRoutes); // Contains /admin/export routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes); // Legacy routes with IDs
app.use('/api/payments', paymentRoutes);

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
