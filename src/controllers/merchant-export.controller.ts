// Merchant Export Controller
import { Request, Response, NextFunction } from 'express';
import merchantExportService from '../services/merchant-export.service.js';

class MerchantExportController {
  // GET /api/merchants/:merchantId/export/esg?startDate=X&endDate=Y
  async exportESGReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
      }

      const filters = {
        merchantId,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const pdfBuffer = await merchantExportService.generateESGReport(filters);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ESG_Report_${merchantId}_${startDate}_${endDate}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new MerchantExportController();
