// QR Code Service - Generate QR codes for merchant SKU combinations
import QRCode from 'qrcode';

interface QRCodeGenerationOptions {
  merchantId: string;
  skuCode: string;
  baseUrl: string; // From env: FRONTEND_URL
}

interface QRCodeResponse {
  qrCodeDataUrl: string; // Base64 image
  targetUrl: string; // The URL encoded in QR
  downloadFileName: string;
}

class QRCodeService {
  async generateQRCode(options: QRCodeGenerationOptions): Promise<QRCodeResponse> {
    const { merchantId, skuCode, baseUrl } = options;

    // Construct target URL with query parameters
    // Format: https://csr26.it/landing?sku=GC-25EUR&merchant=xxx
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const targetUrl = `${cleanBaseUrl}/landing?sku=${encodeURIComponent(skuCode)}&merchant=${encodeURIComponent(merchantId)}`;

    // Generate QR code as data URL (base64 PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 2,
    });

    const downloadFileName = `QR_${merchantId}_${skuCode}_${Date.now()}.png`;

    return {
      qrCodeDataUrl,
      targetUrl,
      downloadFileName,
    };
  }

  // Generate multiple QR codes at once (bulk)
  async generateBulkQRCodes(
    merchantId: string,
    skuCodes: string[],
    baseUrl: string
  ): Promise<QRCodeResponse[]> {
    const promises = skuCodes.map(skuCode =>
      this.generateQRCode({ merchantId, skuCode, baseUrl })
    );
    return await Promise.all(promises);
  }
}

export default new QRCodeService();
