// Merchant Controller - Handles HTTP requests for Merchant management
// NO business logic here - all in service layer
// Priority 4: Stripe Connect Integration endpoints

import { Request, Response, NextFunction } from 'express';
import merchantService from '../services/merchant.service.js';

class MerchantController {
  // ==========================================
  // BASIC MERCHANT CRUD
  // ==========================================

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

  // ==========================================
  // STRIPE CONNECT ENDPOINTS
  // ==========================================

  /**
   * POST /api/admin/merchants/:id/stripe/onboard
   * Start Stripe Connect onboarding for a merchant
   * Returns onboarding URL that admin sends to merchant
   */
  async startStripeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await merchantService.startStripeOnboarding(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Stripe onboarding initiated. Send the onboarding URL to the merchant.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/merchants/:id/stripe/onboarding-link
   * Get a fresh onboarding link (if previous expired)
   */
  async refreshOnboardingLink(req: Request, res: Response, next: NextFunction) {
    try {
      const url = await merchantService.refreshOnboardingLink(req.params.id);
      res.json({
        success: true,
        data: { onboardingUrl: url },
        message: 'New onboarding link generated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/merchants/:id/stripe/dashboard
   * Get Stripe Express Dashboard login link for merchant
   */
  async getStripeDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const url = await merchantService.getStripeDashboardLink(req.params.id);
      res.json({
        success: true,
        data: { dashboardUrl: url },
        message: 'Dashboard link generated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/merchants/:id/stripe/sync
   * Sync merchant's Stripe status with Stripe API
   */
  async syncStripeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await merchantService.syncStripeStatus(req.params.id);
      res.json({
        success: true,
        data: status,
        message: 'Stripe status synced',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/merchants/:id/stripe
   * Disconnect merchant from Stripe Connect
   */
  async disconnectStripe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await merchantService.disconnectStripe(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Stripe account disconnected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/merchants/stripe-status
   * Get all merchants with their Stripe Connect status (for admin overview)
   */
  async getAllWithStripeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const merchants = await merchantService.getMerchantsWithStripeStatus(activeOnly);
      res.json({
        success: true,
        data: merchants,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/merchants/:id/stripe/account-id
   * Manually set Stripe account ID (for existing accounts)
   */
  async setStripeAccountId(req: Request, res: Response, next: NextFunction) {
    try {
      const { stripeAccountId } = req.body;
      if (!stripeAccountId) {
        return res.status(400).json({
          success: false,
          message: 'stripeAccountId is required',
        });
      }
      const merchant = await merchantService.setStripeAccountId(req.params.id, stripeAccountId);
      res.json({
        success: true,
        data: merchant,
        message: 'Stripe account ID set successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MerchantController();
