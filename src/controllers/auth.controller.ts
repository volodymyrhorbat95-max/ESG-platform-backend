// Auth Controller - HTTP handling for authentication endpoints
import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';

class AuthController {
  /**
   * POST /api/auth/request-magic-link
   * Request a magic link to be sent to user's email
   */
  async requestMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      const result = await authService.requestMagicLink(email.toLowerCase());

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-magic-link
   * Verify magic link token and create session
   */
  async verifyMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
        });
      }

      const result = await authService.verifyMagicLink(token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          sessionToken: result.sessionToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-session
   * Verify session token and return user data
   */
  async verifySession(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
        });
      }

      const result = await authService.verifySessionToken(token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal, server just confirms)
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // With JWT, logout is handled client-side by removing the token
      // This endpoint exists for consistency and future server-side session management
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/dev-login
   * DEVELOPMENT ONLY: Login with email directly (bypass magic link)
   * This bypasses the email sending requirement for development
   */
  async devLogin(req: Request, res: Response, next: NextFunction) {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'Development login not available in production',
        });
      }

      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const result = await authService.devLogin(email.toLowerCase());

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          sessionToken: result.sessionToken,
          user: result.user,
        },
        message: 'Development login successful',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
