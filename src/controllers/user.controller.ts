// User Controller - HTTP handling for user endpoints
// Supports 3 registration levels: minimal, standard, full

import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service.js';

class UserController {
  // POST /api/users/register/minimal - Minimal registration (email only)
  async registerMinimal(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const user = await userService.findOrCreateMinimalUser({ email });
      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully (minimal)',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users/register/standard - Standard registration (email + name)
  async registerStandard(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, firstName, lastName, termsAccepted } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, first name, and last name are required',
        });
      }

      const user = await userService.findOrCreateStandardUser({
        email,
        firstName,
        lastName,
        termsAccepted: termsAccepted || false,
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully (standard)',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users/register/full - Full registration (all fields)
  async registerFull(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        firstName,
        lastName,
        dateOfBirth,
        street,
        city,
        postalCode,
        country,
        state,
        termsAccepted,
      } = req.body;

      if (!email || !firstName || !lastName || !dateOfBirth ||
          !street || !city || !postalCode || !country) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required for full registration',
        });
      }

      const user = await userService.findOrCreateFullUser({
        email,
        firstName,
        lastName,
        dateOfBirth,
        street,
        city,
        postalCode,
        country,
        state,
        termsAccepted: termsAccepted || false,
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully (full)',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users/register - Generic registration (auto-determines level)
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        email,
        firstName,
        lastName,
        dateOfBirth,
        street,
        city,
        postalCode,
        country,
        state,
        termsAccepted,
      } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      let user;

      // Determine registration level based on provided data
      if (dateOfBirth && street && city && postalCode && country) {
        // Full registration
        user = await userService.findOrCreateFullUser({
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          dateOfBirth,
          street,
          city,
          postalCode,
          country,
          state,
          termsAccepted: termsAccepted || false,
        });
      } else if (firstName && lastName) {
        // Standard registration
        user = await userService.findOrCreateStandardUser({
          email,
          firstName,
          lastName,
          termsAccepted: termsAccepted || false,
        });
      } else {
        // Minimal registration
        user = await userService.findOrCreateMinimalUser({ email });
      }

      res.status(201).json({
        success: true,
        data: user,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id - Get user by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/email/:email - Get user by email
  async getByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserByEmail(decodeURIComponent(req.params.email));
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users - Get all users (admin)
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:id - Update user profile
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        data: user,
        message: 'User profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id - Delete user (soft delete)
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id/export - Export user data (GDPR)
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = await userService.exportUserData(req.params.id);

      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user_data_${req.params.id}.json"`
      );

      res.json(userData);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
