// QR Code Controller - HTTP handling for QR generation
// Section 15: QR Code Generation for merchants
import { Request, Response, NextFunction } from 'express';
import qrcodeService from '../services/qrcode.service.js';
import { SKU, Merchant, Partner } from '../database/models/index.js';
import { env } from '../config/env.js';

class QRCodeController {
  // POST /api/merchants/:merchantId/qrcodes
  // Section 15.1: Generate QR with sku, amount, partner, merchant parameters
  async generateSingleQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;
      const { skuCode, partnerId, amount, format = 'png', includeLogo = false } = req.body;

      // Validate format
      if (!['png', 'svg', 'pdf'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Must be png, svg, or pdf',
        });
      }

      // Validate merchant exists
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      // Validate partner if provided
      let partner = null;
      if (partnerId) {
        partner = await Partner.findByPk(partnerId);
        if (!partner) {
          return res.status(404).json({
            success: false,
            error: 'Partner not found',
          });
        }
      }

      // Validate SKU exists and is active
      const sku = await SKU.findOne({ where: { code: skuCode, isActive: true } });
      if (!sku) {
        return res.status(404).json({
          success: false,
          error: 'SKU not found or inactive',
        });
      }

      const baseUrl = env.frontend.url;
      const qrCodeData = await qrcodeService.generateQRCode({
        skuCode,
        baseUrl,
        merchantId,
        partnerId,
        amount: amount ? parseFloat(amount) : undefined,
        format: format as 'png' | 'svg' | 'pdf',
        includeLogo,
      });

      res.json({
        success: true,
        data: {
          ...qrCodeData,
          merchant: { id: merchant.id, name: merchant.name },
          partner: partner ? { id: partner.id, name: partner.name } : null,
          sku: { code: sku.code, name: sku.name },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/merchants/:merchantId/qrcodes/bulk
  // Section 15.1: Generate bulk QR codes with partner support
  async generateBulkQRCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;
      const { skuCodes, partnerId, format = 'png', includeLogo = false } = req.body;

      if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'skuCodes must be a non-empty array',
        });
      }

      // Validate format
      if (!['png', 'svg', 'pdf'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Must be png, svg, or pdf',
        });
      }

      // Validate merchant
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      // Validate partner if provided
      let partner = null;
      if (partnerId) {
        partner = await Partner.findByPk(partnerId);
        if (!partner) {
          return res.status(404).json({
            success: false,
            error: 'Partner not found',
          });
        }
      }

      // Validate all SKUs exist
      const skus = await SKU.findAll({
        where: { code: skuCodes, isActive: true },
      });

      if (skus.length !== skuCodes.length) {
        const foundCodes = skus.map(s => s.code);
        const missingCodes = skuCodes.filter((c: string) => !foundCodes.includes(c));
        return res.status(400).json({
          success: false,
          error: `Some SKUs not found or inactive: ${missingCodes.join(', ')}`,
        });
      }

      const baseUrl = env.frontend.url;
      const qrCodes = await qrcodeService.generateBulkQRCodes(
        skuCodes,
        baseUrl,
        {
          merchantId,
          partnerId,
          format: format as 'png' | 'svg' | 'pdf',
          includeLogo,
        }
      );

      // Attach SKU details
      const qrCodesWithDetails = qrCodes.map((qr, index) => ({
        ...qr,
        sku: skus[index],
      }));

      res.json({
        success: true,
        data: {
          merchant: { id: merchant.id, name: merchant.name },
          partner: partner ? { id: partner.id, name: partner.name } : null,
          qrCodes: qrCodesWithDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/qrcodes
  // Section 15.2: General QR code generation for marketing materials, gift cards, etc.
  // No merchant required - supports all URL parameters
  async generateGeneralQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { skuCode, merchantId, partnerId, amount, format = 'png', includeLogo = false } = req.body;

      // Validate format
      if (!['png', 'svg', 'pdf'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Must be png, svg, or pdf',
        });
      }

      // Validate SKU exists and is active
      const sku = await SKU.findOne({ where: { code: skuCode, isActive: true } });
      if (!sku) {
        return res.status(404).json({
          success: false,
          error: 'SKU not found or inactive',
        });
      }

      // Optional: Validate merchant if provided
      let merchant = null;
      if (merchantId) {
        merchant = await Merchant.findByPk(merchantId);
        if (!merchant) {
          return res.status(404).json({
            success: false,
            error: 'Merchant not found',
          });
        }
      }

      // Optional: Validate partner if provided
      let partner = null;
      if (partnerId) {
        partner = await Partner.findByPk(partnerId);
        if (!partner) {
          return res.status(404).json({
            success: false,
            error: 'Partner not found',
          });
        }
      }

      const baseUrl = env.frontend.url;
      const qrCodeData = await qrcodeService.generateQRCode({
        skuCode,
        baseUrl,
        merchantId,
        partnerId,
        amount: amount ? parseFloat(amount) : undefined,
        format: format as 'png' | 'svg' | 'pdf',
        includeLogo,
      });

      res.json({
        success: true,
        data: {
          ...qrCodeData,
          merchant: merchant ? { id: merchant.id, name: merchant.name } : null,
          partner: partner ? { id: partner.id, name: partner.name } : null,
          sku: { code: sku.code, name: sku.name },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new QRCodeController();
