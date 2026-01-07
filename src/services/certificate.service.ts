// Certificate Service - Generate PDF certificates for environmental impact
import PDFDocument from 'pdfkit';
import { Transaction, User, SKU } from '../database/models/index.js';

class CertificateService {
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

      doc.moveDown(2);

      // Certificate body
      doc
        .fontSize(14)
        .fillColor('#374151') // Gray-700
        .font('Helvetica')
        .text('This is to certify that', { align: 'center' });

      doc.moveDown(1);

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

      doc.moveDown(1);

      // Impact statement
      const impactKg = (transaction.calculatedImpact / 1000).toFixed(3);
      const impactGrams = transaction.calculatedImpact.toFixed(0);

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

      doc.moveDown(1);

      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#374151')
        .text('of plastic waste from our oceans and environment', { align: 'center' });

      doc.moveDown(2);

      // Impact equivalents
      const plasticBottles = Math.floor(transaction.calculatedImpact / 25);
      const treesEquivalent = (transaction.calculatedImpact / 21000).toFixed(2);

      doc
        .fontSize(12)
        .fillColor('#6B7280')
        .text('This is equivalent to:', { align: 'center' });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`• ${plasticBottles} plastic bottles`, { align: 'center' })
        .text(`• ${treesEquivalent} trees worth of carbon offset`, { align: 'center' });

      doc.moveDown(2);

      // Transaction details
      doc
        .fontSize(10)
        .fillColor('#9CA3AF')
        .text(`Transaction ID: ${transaction.id}`, { align: 'center' })
        .text(`Date: ${transaction.createdAt.toISOString().split('T')[0]}`, { align: 'center' })
        .text(`SKU: ${transaction.sku.code} - ${transaction.sku.name}`, { align: 'center' });

      doc.moveDown(3);

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
      doc.moveDown(1);
      doc
        .fontSize(8)
        .fillColor('#9CA3AF')
        .text('This certificate is digitally verified and traceable on the blockchain.', {
          align: 'center',
        })
        .text(
          'Scan the QR code or visit our website to verify authenticity.',
          { align: 'center' }
        );

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
}

export default new CertificateService();
