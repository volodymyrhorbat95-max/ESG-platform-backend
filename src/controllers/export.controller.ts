// Export Controller - HTTP handling for data export
import { Request, Response, NextFunction } from 'express';
import exportService from '../services/export.service.js';

class ExportController {
  // Generate Amplivo export
  async exportAmplivo(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, merchantId, partnerId, userId, amplivoOnly, format } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (merchantId) filters.merchantId = merchantId as string;
      if (partnerId) filters.partnerId = partnerId as string;
      if (userId) filters.userId = userId as string;
      if (amplivoOnly === 'true') filters.amplivoOnly = true;

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generateAmplivoExport(filters, fileFormat);

      // Set headers for file download
      const filename = `amplivo_export_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Generate partner report
  async exportPartnerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { partnerId } = req.params;
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generatePartnerReport(
        partnerId,
        new Date(startDate as string),
        new Date(endDate as string),
        fileFormat
      );

      // Set headers for file download
      const filename = `partner_report_${partnerId}_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Generate Stripe reconciliation report
  async exportStripeReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generateStripeReconciliationReport(
        new Date(startDate as string),
        new Date(endDate as string),
        fileFormat
      );

      // Set headers for file download
      const filename = `stripe_reconciliation_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Generate aggregate impact report
  async exportImpactReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generateImpactReport(
        new Date(startDate as string),
        new Date(endDate as string),
        fileFormat
      );

      // Set headers for file download
      const filename = `impact_report_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Generate trend analysis report (monthly breakdown with MoM growth)
  async exportTrendAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generateTrendAnalysisReport(
        new Date(startDate as string),
        new Date(endDate as string),
        fileFormat
      );

      // Set headers for file download
      const filename = `trend_analysis_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // Generate per-SKU performance report
  async exportSKUPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, format } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const fileFormat = (format as 'xlsx' | 'csv') || 'xlsx';
      const buffer = await exportService.generateSKUPerformanceReport(
        new Date(startDate as string),
        new Date(endDate as string),
        fileFormat
      );

      // Set headers for file download
      const filename = `sku_performance_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
      res.setHeader('Content-Type', fileFormat === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new ExportController();
