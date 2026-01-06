// Merchant Controller - Handles HTTP requests for Merchant management
// NO business logic here - all in service layer

import { Request, Response, NextFunction } from 'express';
import merchantService from '../services/merchant.service.js';

class MerchantController {
  // POST /api/admin/merchants - Create new merchant
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await merchantService.createMerchant(req.body);
      res.status(201).json({
        success: true,
        data: merchant,
        message: 'Merchant created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/merchants - Get all merchants
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const merchants = await merchantService.getAllMerchants(activeOnly);
      res.json({
        success: true,
        data: merchants,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/merchants/:id - Get merchant by ID (public for payment flow)
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await merchantService.getMerchantById(req.params.id);
      res.json({
        success: true,
        data: merchant,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/merchants/:id - Update merchant
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await merchantService.updateMerchant(req.params.id, req.body);
      res.json({
        success: true,
        data: merchant,
        message: 'Merchant updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/merchants/:id - Deactivate merchant
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const merchant = await merchantService.deleteMerchant(req.params.id);
      res.json({
        success: true,
        data: merchant,
        message: 'Merchant deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MerchantController();
