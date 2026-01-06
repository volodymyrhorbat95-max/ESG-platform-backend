import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service.js';

// Extend Express Request type to include admin flag
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

// Middleware to verify admin authentication
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const isValid = adminService.verifyAdminToken(token);

    if (!isValid) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired admin token',
      });
      return;
    }

    // Add admin flag to request
    req.isAdmin = true;

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};
