// Certificate Controller - HTTP handling for certificate generation
// Section 9: Certificate Generation
// - Download certificate PDF
// - Preview certificate in browser
// - Verify certificate authenticity (for QR code scanning)
import { Request, Response, NextFunction } from 'express';
import certificateService from '../services/certificate.service.js';

class CertificateController {
  // GET /api/certificates/:transactionId - Download certificate PDF
  async downloadCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      const pdfBuffer = await certificateService.generateCertificatePDF(transactionId);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="CSR26_Certificate_${transactionId.substring(0, 8)}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/certificates/:transactionId/preview - Preview certificate in browser
  async previewCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      const pdfBuffer = await certificateService.generateCertificatePDF(transactionId);

      // Set headers for inline PDF display
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/certificates/:transactionId/verify - Verify certificate authenticity
  // This endpoint is called when QR code is scanned or verification page is visited
  async verifyCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.params;

      const verificationResult = await certificateService.verifyCertificate(transactionId);

      if (!verificationResult) {
        return res.status(404).json({
          isValid: false,
          error: 'Certificate not found',
          message: 'The certificate with the provided transaction ID does not exist.',
        });
      }

      res.json(verificationResult);
    } catch (error) {
      next(error);
    }
  }
}

export default new CertificateController();
