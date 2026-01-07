// Config Routes - Endpoints for global configuration management
import { Router } from 'express';
import configController from '../controllers/config.controller.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// GET /api/config/:key - Get configuration value by key
// Public endpoint - can read config values (e.g., CURRENT_CSR_PRICE for calculations)
router.get('/:key', configController.getValue);

// GET /api/config - Get all configuration entries (admin only)
router.get('/', requireAdmin, configController.getAll);

// PUT /api/config/:key - Update configuration value (admin only)
router.put('/:key', requireAdmin, configController.setValue);

// DELETE /api/config/:key - Delete configuration (admin only, use with caution)
router.delete('/:key', requireAdmin, configController.deleteConfig);

export default router;
