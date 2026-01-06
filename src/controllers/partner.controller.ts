// Partner Controller - Handles HTTP requests for Partner management
// NO business logic here - all in service layer

import { Request, Response, NextFunction } from 'express';
import partnerService from '../services/partner.service.js';

class PartnerController {
  // POST /api/admin/partners - Create new partner
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const partner = await partnerService.createPartner(req.body);
      res.status(201).json({
        success: true,
        data: partner,
        message: 'Partner created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/partners - Get all partners
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const partners = await partnerService.getAllPartners(activeOnly);
      res.json({
        success: true,
        data: partners,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/partners/:id - Get partner by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const partner = await partnerService.getPartnerById(req.params.id);
      res.json({
        success: true,
        data: partner,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/partners/:id - Update partner
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const partner = await partnerService.updatePartner(req.params.id, req.body);
      res.json({
        success: true,
        data: partner,
        message: 'Partner updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/partners/:id - Deactivate partner
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const partner = await partnerService.deactivatePartner(req.params.id);
      res.json({
        success: true,
        data: partner,
        message: 'Partner deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PartnerController();
