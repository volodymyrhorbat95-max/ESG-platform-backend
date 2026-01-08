// Certificate Service - Generate PDF certificates for environmental impact
// Section 9: Certificate Generation
// - PDF certificate for each completed transaction
// - Downloadable from user dashboard transaction history
// - Contains: Transaction details, impact amount, user info, verification QR code
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Transaction, User, SKU } from '../database/models/index.js';

// Get verification URL from environment or use default
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class CertificateService {
  /**
   * Generate QR code as base64 PNG buffer for embedding in PDF
   * QR code contains verification URL for the certificate
   */
  private async generateVerificationQRCode(transactionId: string): Promise<Buffer> {
    const verificationUrl = `${FRONTEND_URL}/verify/${transactionId}`;

    // Generate QR code as PNG buffer for PDFKit
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 120,
      color: {
        dark: '#047857', // Green-700 to match certificate theme
        light: '#FFFFFF',
      },
    });

    return qrBuffer;
  }

  // Generate certificate PDF for a transaction
  async generateCertificatePDF(transactionId: string): Promise<Buffer> {
    // Fetch transaction with user and SKU data
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Generate QR code for verification
    const qrCodeBuffer = await this.generateVerificationQRCode(transactionId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 72, right: 72 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Certificate Header
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#047857') // Green-700
        .text('Environmental Impact Certificate', { align: 'center' });

      doc.moveDown(0.5);

      // Decorative line
      doc
        .strokeColor('#10B981') // Green-500
        .lineWidth(2)
        .moveTo(72, doc.y)
        .lineTo(doc.page.width - 72, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // Certificate body
      doc
        .fontSize(14)
        .fillColor('#374151') // Gray-700
        .font('Helvetica')
        .text('This is to certify that', { align: 'center' });

      doc.moveDown(0.8);

      // User name (or email if minimal registration)
      const userName =
        transaction.user.firstName !== 'Guest'
          ? `${transaction.user.firstName} ${transaction.user.lastName}`
          : transaction.user.email;

      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text(userName, { align: 'center' });

      doc.moveDown(0.8);

      // Impact statement
      const impactKg = (Number(transaction.calculatedImpact) / 1000).toFixed(3);
      const impactGrams = Number(transaction.calculatedImpact).toFixed(0);

      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#374151')
        .text('has contributed to the removal of', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text(`${impactKg} kg`, { align: 'center' });

      doc.moveDown(0.3);

      doc
        .fontSize(18)
        .fillColor('#6B7280')
        .text(`(${impactGrams} grams)`, { align: 'center' });

      doc.moveDown(0.8);

      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#374151')
        .text('of plastic waste from our oceans and environment', { align: 'center' });

      doc.moveDown(1.5);

      // Impact equivalents
      const plasticBottles = Math.floor(Number(transaction.calculatedImpact) / 25);
      const treesEquivalent = (Number(transaction.calculatedImpact) / 21000).toFixed(2);
      const oceanCleanup = (Number(transaction.calculatedImpact) / 500).toFixed(1);

      doc
        .fontSize(12)
        .fillColor('#6B7280')
        .text('This is equivalent to:', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`• ${plasticBottles.toLocaleString()} plastic bottles removed`, { align: 'center' })
        .text(`• ${treesEquivalent} trees worth of carbon offset`, { align: 'center' })
        .text(`• ${oceanCleanup} kg of ocean cleanup contribution`, { align: 'center' });

      doc.moveDown(1.5);

      // Transaction details
      doc
        .fontSize(10)
        .fillColor('#9CA3AF')
        .text(`Transaction ID: ${transaction.id}`, { align: 'center' })
        .text(`Date: ${transaction.createdAt.toISOString().split('T')[0]}`, { align: 'center' })
        .text(`SKU: ${transaction.sku.code} - ${transaction.sku.name}`, { align: 'center' });

      doc.moveDown(1.5);

      // QR Code Section - centered
      doc
        .fontSize(9)
        .fillColor('#6B7280')
        .text('Scan to verify:', { align: 'center' });

      doc.moveDown(0.3);

      // Calculate center position for QR code
      const qrSize = 100;
      const pageWidth = doc.page.width;
      const qrX = (pageWidth - qrSize) / 2;

      // Embed QR code in PDF
      doc.image(qrCodeBuffer, qrX, doc.y, {
        width: qrSize,
        height: qrSize,
      });

      doc.y += qrSize + 10;

      // Verification URL text
      doc
        .fontSize(8)
        .fillColor('#9CA3AF')
        .text(`${FRONTEND_URL}/verify/${transactionId}`, { align: 'center' });

      doc.moveDown(1.5);

      // Footer
      doc
        .strokeColor('#10B981')
        .lineWidth(1)
        .moveTo(72, doc.y)
        .lineTo(doc.page.width - 72, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text('CSR26 Impact Processor', { align: 'center' })
        .text('Certified Environmental Asset Management', { align: 'center' })
        .text('https://csr26.com', { align: 'center', link: 'https://csr26.com' });

      // Verification note
      doc.moveDown(0.8);
      doc
        .fontSize(8)
        .fillColor('#9CA3AF')
        .text('This certificate is verified through the CPRS protocol and complies with EU sustainability', {
          align: 'center',
        })
        .text('reporting directives (CSRD). The environmental asset is auditable and traceable.', {
          align: 'center',
        });

      // Finalize PDF
      doc.end();
    });
  }

  // Generate certificate for email attachment
  async generateCertificateForEmail(
    transactionId: string
  ): Promise<{ filename: string; content: Buffer }> {
    const pdfBuffer = await this.generateCertificatePDF(transactionId);
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const filename = `CSR26_Certificate_${transaction.id.substring(0, 8)}.pdf`;

    return {
      filename,
      content: pdfBuffer,
    };
  }

  /**
   * Verify a certificate by transaction ID
   * Returns transaction details for verification page
   */
  async verifyCertificate(transactionId: string) {
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: SKU, as: 'sku', attributes: ['id', 'code', 'name', 'paymentMode'] },
      ],
    });

    if (!transaction) {
      return null;
    }

    // Return verification data (limited fields for privacy)
    return {
      transactionId: transaction.id,
      isValid: true,
      verifiedAt: new Date().toISOString(),
      details: {
        impactGrams: Number(transaction.calculatedImpact),
        impactKg: (Number(transaction.calculatedImpact) / 1000).toFixed(3),
        date: transaction.createdAt.toISOString().split('T')[0],
        sku: {
          code: transaction.sku.code,
          name: transaction.sku.name,
        },
        user: {
          name:
            transaction.user.firstName !== 'Guest'
              ? `${transaction.user.firstName} ${transaction.user.lastName}`
              : 'Anonymous User',
        },
        equivalents: {
          plasticBottles: Math.floor(Number(transaction.calculatedImpact) / 25),
          trees: (Number(transaction.calculatedImpact) / 21000).toFixed(2),
          oceanCleanup: (Number(transaction.calculatedImpact) / 500).toFixed(1),
        },
      },
    };
  }
}

export default new CertificateService();
