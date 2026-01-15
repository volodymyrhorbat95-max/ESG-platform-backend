// Config Routes - Endpoints for global configuration management
import { Router } from 'express';
import configController from '../controllers/config.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// IMPORTANT: Route order matters! Exact matches must come before parameter routes

// GET /api/config - Get all configuration entries (admin only)
// Must be defined BEFORE /:key to avoid being caught by parameter route
router.get('/', requireAdmin, configController.getAll);

// GET /api/config/:key/history - Get configuration change history (admin only)
// Must be defined BEFORE /:key to avoid being caught by parameter route
router.get('/:key/history', requireAdmin, configController.getHistory);

// GET /api/config/:key - Get configuration value by key
// Public endpoint - can read config values (e.g., CURRENT_CSR_PRICE for calculations)
router.get('/:key', configController.getValue);

// PUT /api/config/:key - Update configuration value (admin only)
router.put('/:key', requireAdmin, configController.setValue);

// DELETE /api/config/:key - Delete configuration (admin only, use with caution)
router.delete('/:key', requireAdmin, configController.deleteConfig);

export default router;
