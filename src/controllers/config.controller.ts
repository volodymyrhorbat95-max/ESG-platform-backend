// Config Controller - HTTP handlers for global configuration management
import { Request, Response, NextFunction } from 'express';
import configService from '../services/config.service.js';

class ConfigController {
  // GET /api/config/:key - Get configuration value by key
  async getValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const value = await configService.getValue(key);

      res.json({
        success: true,
        data: { key, value },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/config - Get all configuration entries (admin only)
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await configService.getAllConfig();

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/config/:key - Update configuration value (admin only)
  async setValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      if (!value) {
        return res.status(400).json({
          success: false,
          error: 'Value is required',
        });
      }

      // Special validation for CURRENT_CSR_PRICE
      if (key === 'CURRENT_CSR_PRICE') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          return res.status(400).json({
            success: false,
            error: 'CURRENT_CSR_PRICE must be a positive number',
          });
        }
      }

      // Get admin identifier from request (could be from JWT token or session)
      // For now, using a placeholder - this should be replaced with actual admin identification
      const changedBy = (req as any).adminEmail || 'admin';

      const config = await configService.setValue(key, value, description, changedBy);

      res.json({
        success: true,
        data: config,
        message: `Configuration '${key}' updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/config/:key/history - Get configuration change history (admin only)
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const history = await configService.getConfigHistory(key);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/config/:key - Delete configuration (admin only, use with caution)
  async deleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      await configService.deleteConfig(key);

      res.json({
        success: true,
        message: `Configuration '${key}' deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConfigController();
