// SKU Controller - Handles HTTP requests for SKU management
// NO business logic here - all in service layer

import { Request, Response, NextFunction } from 'express';
import skuService from '../services/sku.service.js';

class SKUController {
  // POST /api/skus - Create new SKU
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = await skuService.createSKU(req.body);
      res.status(201).json({
        success: true,
        data: sku,
        message: 'SKU created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/skus - Get all SKUs
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const skus = await skuService.getAllSKUs(activeOnly);
      res.json({
        success: true,
        data: skus,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/skus/:id - Get SKU by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = await skuService.getSKUById(req.params.id);
      res.json({
        success: true,
        data: sku,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/skus/code/:code - Get SKU by code
  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = await skuService.getSKUByCode(req.params.code);
      res.json({
        success: true,
        data: sku,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/impact?code=XXX - Get SKU impact data for landing page
  async getImpactByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'SKU code is required',
        });
      }

      const sku = await skuService.getSKUByCode(code);

      // Return only impact-relevant data for landing page
      res.json({
        success: true,
        data: {
          code: sku.code,
          name: sku.name,
          gramsWeight: sku.gramsWeight,
          price: sku.price,
          paymentMode: sku.paymentMode,
          requiresValidation: sku.requiresValidation,
          impactMultiplier: sku.impactMultiplier,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/skus/:id - Update SKU
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = await skuService.updateSKU(req.params.id, req.body);
      res.json({
        success: true,
        data: sku,
        message: 'SKU updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/skus/:id - Deactivate SKU
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const sku = await skuService.deleteSKU(req.params.id);
      res.json({
        success: true,
        data: sku,
        message: 'SKU deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SKUController();
