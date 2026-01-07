// User Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service.js';

class UserController {
  // POST /api/users/register - Register/find user
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findOrCreateUser(req.body);
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
      const user = await userService.getUserByEmail(req.params.email);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users - Get all users
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
