// Merchant Export Service - ESG report generation for merchants
import PDFDocument from 'pdfkit';
import { Transaction, SKU, Merchant } from '../database/models/index.js';
import { Op } from 'sequelize';

interface ESGReportFilters {
  merchantId: string;
  startDate: Date;
  endDate: Date;
}

class MerchantExportService {
  async generateESGReport(filters: ESGReportFilters): Promise<Buffer> {
    const { merchantId, startDate, endDate } = filters;

    // Fetch merchant details
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Fetch transactions in period
    const transactions = await Transaction.findAll({
      where: {
        merchantId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        paymentStatus: ['COMPLETED', 'N/A'],
      },
      include: [{ model: SKU, as: 'sku' }],
      order: [['createdAt', 'DESC']],
    });

    // Calculate metrics
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalImpactGrams = transactions.reduce((sum, t) => sum + Number(t.calculatedImpact), 0);
    const totalImpactKg = totalImpactGrams / 1000;

    // Impact equivalents
    const plasticBottles = Math.floor(totalImpactGrams / 25);
    const treesEquivalent = (totalImpactGrams / 21000).toFixed(2);
    const oceanCleanup = (totalImpactGrams / 500).toFixed(1);

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text('Environmental, Social & Governance', { align: 'center' });

      doc
        .fontSize(20)
        .text('Impact Report', { align: 'center' });

      doc.moveDown(0.5);

      // Merchant info
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#374151')
        .text(`Merchant: ${merchant.name}`, { align: 'center' })
        .text(`Report Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`, { align: 'center' })
        .text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });

      doc.moveDown(1);

      // Decorative line
      doc
        .strokeColor('#10B981')
        .lineWidth(2)
        .moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .stroke();

      doc.moveDown(2);

      // Executive Summary
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text('Executive Summary');

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          `During the reporting period, ${merchant.name} facilitated ${totalTransactions} environmental impact transactions ` +
          `through the CSR26 Impact Processor platform. These transactions contributed to the removal of ${totalImpactKg.toFixed(3)} kilograms ` +
          `of plastic waste from our oceans and environment, representing a significant commitment to environmental sustainability.`,
          { align: 'justify', lineGap: 4 }
        );

      doc.moveDown(1.5);

      // Key Metrics Section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text('Key Environmental Metrics');

      doc.moveDown(0.5);

      // Metrics table
      const startY = doc.y;
      const col1X = 60;
      const col2X = 300;
      const rowHeight = 30;

      const metrics = [
        { label: 'Total Plastic Waste Removed', value: `${totalImpactKg.toFixed(3)} kg` },
        { label: 'Customer Transactions', value: totalTransactions.toString() },
        { label: 'Revenue Generated', value: `€${totalRevenue.toFixed(2)}` },
        { label: 'Plastic Bottles Equivalent', value: plasticBottles.toLocaleString() },
        { label: 'Trees Worth of Impact', value: treesEquivalent },
        { label: 'Ocean Cleanup Contributions', value: oceanCleanup },
      ];

      metrics.forEach((metric, index) => {
        const y = startY + (index * rowHeight);

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text(metric.label, col1X, y, { width: 220 });

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#047857')
          .text(metric.value, col2X, y, { width: 200, align: 'right' });
      });

      doc.moveDown(8);

      // Environmental Narrative
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text('Environmental Impact Narrative');

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          `The removal of ${totalImpactKg.toFixed(3)} kg of plastic waste represents a tangible contribution to marine conservation ` +
          `and environmental protection. This is equivalent to removing approximately ${plasticBottles.toLocaleString()} plastic bottles ` +
          `from our ecosystems.`,
          { align: 'justify', lineGap: 4 }
        );

      doc.moveDown(0.5);

      doc.text(
        `Our partnership with Amplivo ensures that plastic waste is intercepted before it reaches vulnerable ocean environments, ` +
        `particularly in high-risk coastal regions. Each gram of plastic removed prevents harm to marine life, protects coastal ` +
        `ecosystems, and contributes to the global effort to combat ocean plastic pollution.`,
        { align: 'justify', lineGap: 4 }
      );

      doc.moveDown(1.5);

      // Methodology
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text('Methodology & Verification');

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#374151')
        .text(
          'All impact calculations are based on verified transaction data processed through the CSR26 Impact Processor platform. ' +
          'Impact metrics are calculated using standardized conversion factors:\n\n' +
          '• 1 plastic bottle = 25 grams\n' +
          '• 1 tree carbon offset = 21 kg of plastic impact\n' +
          '• 1 ocean cleanup contribution = 500 grams',
          { align: 'left', lineGap: 4 }
        );

      // Add new page for detailed transactions (optional)
      if (transactions.length > 0 && transactions.length <= 20) {
        doc.addPage();

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#047857')
          .text('Transaction Details');

        doc.moveDown(1);

        doc.fontSize(9).font('Helvetica');

        transactions.slice(0, 20).forEach(t => {
          doc.text(
            `${t.createdAt.toISOString().split('T')[0]} | ` +
            `${t.sku.code} | ` +
            `€${Number(t.amount).toFixed(2)} | ` +
            `${(Number(t.calculatedImpact) / 1000).toFixed(3)} kg`,
            { lineGap: 2 }
          );
        });

        if (transactions.length > 20) {
          doc.moveDown(0.5);
          doc.text(`... and ${transactions.length - 20} more transactions`, { align: 'center' });
        }
      }

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .fillColor('#9CA3AF')
        .text('CSR26 Impact Processor | Certified Environmental Asset Management', { align: 'center' })
        .text('This report is generated from verified blockchain-backed transaction data', { align: 'center' });

      doc.end();
    });
  }
}

export default new MerchantExportService();
