import { Request, Response } from 'express';
import adminService from '../services/admin.service.js';
import { env } from '../config/env.js';

class AdminController {
  // Admin login with secret code
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          error: 'Admin code is required',
        });
        return;
      }

      // Validate code and generate token
      const result = await adminService.loginAdmin(code);

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          token: result.token,
          role: 'admin',
        },
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login',
      });
    }
  }

  // Verify admin token (optional - for frontend to check if still authenticated)
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'No authorization token provided',
        });
        return;
      }

      const token = authHeader.substring(7);
      const isValid = adminService.verifyAdminToken(token);

      if (!isValid) {
        res.status(403).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          role: 'admin',
          authenticated: true,
        },
      });
    } catch (error) {
      console.error('Admin verify error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify token',
      });
    }
  }

  // Get admin SKU code (for frontend to know which SKU to use)
  async getSKU(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          sku: env.admin.sku,
        },
      });
    } catch (error) {
      console.error('Get admin SKU error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin SKU',
      });
    }
  }
}

export default new AdminController();
