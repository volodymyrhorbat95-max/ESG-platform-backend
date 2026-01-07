// QR Code Controller - HTTP handling for QR generation
import { Request, Response, NextFunction } from 'express';
import qrcodeService from '../services/qrcode.service.js';
import { SKU, Merchant } from '../database/models/index.js';

class QRCodeController {
  // POST /api/merchants/:merchantId/qrcodes
  async generateSingleQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;
      const { skuCode } = req.body;

      // Validate merchant exists
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: 'Merchant not found',
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

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrCodeData = await qrcodeService.generateQRCode({
        merchantId,
        skuCode,
        baseUrl,
      });

      res.json({
        success: true,
        data: {
          ...qrCodeData,
          merchant: { id: merchant.id, name: merchant.name },
          sku: { code: sku.code, name: sku.name },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/merchants/:merchantId/qrcodes/bulk
  async generateBulkQRCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;
      const { skuCodes } = req.body; // Array of SKU codes

      if (!Array.isArray(skuCodes) || skuCodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'skuCodes must be a non-empty array',
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

      // Validate all SKUs exist
      const skus = await SKU.findAll({
        where: { code: skuCodes, isActive: true },
      });

      if (skus.length !== skuCodes.length) {
        const foundCodes = skus.map(s => s.code);
        const missingCodes = skuCodes.filter(c => !foundCodes.includes(c));
        return res.status(400).json({
          success: false,
          error: `Some SKUs not found or inactive: ${missingCodes.join(', ')}`,
        });
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrCodes = await qrcodeService.generateBulkQRCodes(merchantId, skuCodes, baseUrl);

      // Attach SKU details
      const qrCodesWithDetails = qrCodes.map((qr, index) => ({
        ...qr,
        sku: skus[index],
      }));

      res.json({
        success: true,
        data: {
          merchant: { id: merchant.id, name: merchant.name },
          qrCodes: qrCodesWithDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new QRCodeController();
