// QR Code Service - Generate QR codes for merchant SKU combinations
// Supports PNG, SVG, PDF formats with optional logo embedding
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QRCodeGenerationOptions {
  skuCode: string;
  baseUrl: string; // From env: FRONTEND_URL
  merchantId?: string; // Merchant attribution
  partnerId?: string; // Partner attribution (for royalty tracking)
  amount?: number; // For ALLOCATION type SKUs
  format?: 'png' | 'svg' | 'pdf'; // Default: 'png'
  includeLogo?: boolean; // Default: false
}

interface QRCodeResponse {
  qrCodeData: string; // Base64 for PNG, SVG string for SVG, Buffer for PDF
  targetUrl: string; // The URL encoded in QR
  downloadFileName: string;
  format: 'png' | 'svg' | 'pdf';
  mimeType: string;
}

class QRCodeService {
  private logoPath: string;

  constructor() {
    // Logo path - can be configured via environment variable
    // For now, using a placeholder path that can be updated
    this.logoPath = process.env.CSR26_LOGO_PATH || path.join(__dirname, '../../assets/csr26-logo.png');
  }

  async generateQRCode(options: QRCodeGenerationOptions): Promise<QRCodeResponse> {
    const { skuCode, baseUrl, merchantId, partnerId, amount, format = 'png', includeLogo = false } = options;

    // Construct target URL with query parameters
    // Section 15.1: Format: https://csr26.it/landing?sku=SKU_CODE&amount=X&partner=PARTNER_ID
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Build URL parameters
    const params = new URLSearchParams();
    params.append('sku', skuCode);
    if (amount !== undefined && amount > 0) {
      params.append('amount', amount.toString());
    }
    if (partnerId) {
      params.append('partner', partnerId);
    }
    if (merchantId) {
      params.append('merchant', merchantId);
    }

    const targetUrl = `${cleanBaseUrl}/landing?${params.toString()}`;

    // Generate filename with available identifiers
    const identifier = merchantId || partnerId || 'general';
    const downloadFileName = `QR_${identifier}_${skuCode}_${Date.now()}.${format}`;

    // Generate based on format
    switch (format) {
      case 'svg':
        return await this.generateSVG(targetUrl, downloadFileName, includeLogo);
      case 'pdf':
        return await this.generatePDF(targetUrl, downloadFileName, skuCode, includeLogo);
      case 'png':
      default:
        return await this.generatePNG(targetUrl, downloadFileName, includeLogo);
    }
  }

  /**
   * Generate PNG format QR code
   * Section 14.3: High contrast (black on white), 512x512px for printability
   */
  private async generatePNG(targetUrl: string, downloadFileName: string, includeLogo: boolean): Promise<QRCodeResponse> {
    // Generate base QR code with high error correction for logo embedding
    const errorCorrectionLevel = includeLogo ? 'H' : 'M';

    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel,
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',  // Black (high contrast)
        light: '#FFFFFF', // White (high contrast)
      },
    });

    // TODO: Logo embedding requires canvas manipulation
    // For now, returning base QR code
    // Future enhancement: Use canvas to overlay logo in center
    if (includeLogo) {
      console.warn('Logo embedding for PNG format requires canvas library - returning base QR code');
    }

    return {
      qrCodeData: qrCodeDataUrl,
      targetUrl,
      downloadFileName,
      format: 'png',
      mimeType: 'image/png',
    };
  }

  /**
   * Generate SVG format QR code (scalable vector graphics)
   * Section 14.3: Downloadable SVG format for professional printing
   */
  private async generateSVG(targetUrl: string, downloadFileName: string, includeLogo: boolean): Promise<QRCodeResponse> {
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      errorCorrectionLevel: includeLogo ? 'H' : 'M',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // TODO: Logo embedding in SVG requires XML manipulation
    if (includeLogo) {
      console.warn('Logo embedding for SVG format requires XML manipulation - returning base SVG');
    }

    return {
      qrCodeData: svgString,
      targetUrl,
      downloadFileName,
      format: 'svg',
      mimeType: 'image/svg+xml',
    };
  }

  /**
   * Generate PDF format QR code with print-ready specifications
   * Section 14.3: Downloadable PDF format with instructions and branding
   */
  private async generatePDF(
    targetUrl: string,
    downloadFileName: string,
    skuCode: string,
    includeLogo: boolean
  ): Promise<QRCodeResponse> {
    // First generate PNG QR code to embed in PDF
    const qrPngDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: includeLogo ? 'H' : 'M',
      type: 'image/png',
      width: 300, // Smaller size for PDF embedding
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Remove data:image/png;base64, prefix
    const qrImageBase64 = qrPngDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrImageBuffer = Buffer.from(qrImageBase64, 'base64');

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text('CSR26 Environmental Impact', { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(14)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Scan to view your environmental contribution', { align: 'center' });

    doc.moveDown(1.5);

    // QR Code (centered)
    const qrSize = 250;
    const pageWidth = doc.page.width;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = doc.y;

    doc.image(qrImageBuffer, qrX, qrY, {
      width: qrSize,
      height: qrSize,
    });

    doc.moveDown(13); // Move past QR code

    // SKU Information
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(`Product Code: ${skuCode}`, { align: 'center' });

    doc.moveDown(1);

    // URL (smaller text)
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(targetUrl, { align: 'center' });

    doc.moveDown(2);

    // Print specifications box
    doc.strokeColor('#CCCCCC')
      .lineWidth(1)
      .rect(50, doc.y, pageWidth - 100, 120)
      .stroke();

    doc.moveDown(0.5);

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Print Specifications:', 70, doc.y);

    doc.moveDown(0.5);

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#333333');

    const specs = [
      '• Minimum print size: 2cm x 2cm (0.8" x 0.8") for reliable scanning',
      '• Recommended print size: 3cm x 3cm (1.2" x 1.2") or larger',
      '• Use high-quality printer (300 DPI or higher)',
      '• Ensure high contrast (black on white background)',
      '• Test scan before mass printing',
    ];

    specs.forEach(spec => {
      doc.text(spec, 70);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // Footer
    doc.fontSize(8)
      .fillColor('#999999')
      .text('Generated by CSR26 Impact Processor', { align: 'center' });

    doc.fontSize(7)
      .text(`${new Date().toISOString().split('T')[0]}`, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Convert to base64 for transmission
    const pdfBase64 = pdfBuffer.toString('base64');

    return {
      qrCodeData: `data:application/pdf;base64,${pdfBase64}`,
      targetUrl,
      downloadFileName,
      format: 'pdf',
      mimeType: 'application/pdf',
    };
  }

  /**
   * Generate multiple QR codes at once (bulk)
   * Section 15.1: Supports all URL parameters (sku, amount, partner, merchant)
   */
  async generateBulkQRCodes(
    skuCodes: string[],
    baseUrl: string,
    options: {
      merchantId?: string;
      partnerId?: string;
      format?: 'png' | 'svg' | 'pdf';
      includeLogo?: boolean;
    } = {}
  ): Promise<QRCodeResponse[]> {
    const { merchantId, partnerId, format = 'png', includeLogo = false } = options;
    const promises = skuCodes.map(skuCode =>
      this.generateQRCode({ skuCode, baseUrl, merchantId, partnerId, format, includeLogo })
    );
    return await Promise.all(promises);
  }
}

export default new QRCodeService();
