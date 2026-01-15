import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Middleware to verify user authentication via JWT token
 * Extracts userId from verified JWT and adds to req.userId
 * This prevents users from accessing other users' data
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token using auth service
    const verification = await authService.verifySessionToken(token);

    if (!verification.success || !verification.user) {
      res.status(403).json({
        success: false,
        error: verification.error || 'Invalid or expired session',
      });
      return;
    }

    // Add authenticated user data to request
    req.userId = verification.user.id;
    req.userEmail = verification.user.email;

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds userId to request if valid token provided, but doesn't reject if missing
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verification = await authService.verifySessionToken(token);

      if (verification.success && verification.user) {
        req.userId = verification.user.id;
        req.userEmail = verification.user.email;
      }
    }

    // Always proceed, whether authenticated or not
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
