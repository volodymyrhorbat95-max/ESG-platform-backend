// Export Service - Generate Excel/CSV files for Amplivo submission
import * as XLSX from 'xlsx';
import { Transaction, User, SKU, Merchant } from '../database/models/index.js';

interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  merchantId?: string;
  partnerId?: string;
  userId?: string;
  amplivoOnly?: boolean;
}

class ExportService {
  // Generate Amplivo export data
  async generateAmplivoExport(filters: ExportFilters, format: 'xlsx' | 'csv' = 'xlsx') {
    // Log export operation
    console.log(`📊 Export initiated - Format: ${format}, Filters:`, {
      dateRange: filters.startDate && filters.endDate
        ? `${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`
        : 'All dates',
      merchantId: filters.merchantId || 'All merchants',
      partnerId: filters.partnerId || 'All partners',
      userId: filters.userId || 'All users',
      amplivoOnly: filters.amplivoOnly || false,
    });

    // Build query filters
    const where: any = {};

    if (filters.startDate) {
      where.createdAt = { ...where.createdAt, $gte: filters.startDate };
    }
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, $lte: filters.endDate };
    }
    if (filters.merchantId) {
      where.merchantId = filters.merchantId;
    }
    if (filters.partnerId) {
      where.partnerId = filters.partnerId;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.amplivoOnly) {
      where.amplivoFlag = true;
    }

    // Fetch transactions with all related data
    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'street', 'city', 'postalCode', 'country'],
        },
        {
          model: SKU,
          as: 'sku',
          attributes: ['code', 'name', 'paymentMode'],
        },
        {
          model: Merchant,
          as: 'merchant',
          attributes: ['name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format data for export
    const exportData = transactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Date': transaction.createdAt.toISOString().split('T')[0],
      'User ID': transaction.userId,
      'User Name': `${transaction.user.firstName} ${transaction.user.lastName}`,
      'User Email': transaction.user.email,
      'User DOB': transaction.user.dateOfBirth.toISOString().split('T')[0],
      'Street': transaction.user.street,
      'City': transaction.user.city,
      'Postal Code': transaction.user.postalCode,
      'Country': transaction.user.country,
      'SKU Code': transaction.sku.code,
      'SKU Name': transaction.sku.name,
      'Payment Mode': transaction.sku.paymentMode,
      'Amount (EUR)': Number(transaction.amount).toFixed(2),
      'Impact (grams)': Number(transaction.calculatedImpact).toFixed(2),
      'Merchant': transaction.merchant?.name || 'N/A',
      'Partner ID': transaction.partnerId || 'N/A',
      'Order ID': transaction.orderId || 'N/A',
      'Payment Status': transaction.paymentStatus,
      'Amplivo Flag': transaction.amplivoFlag ? 'YES' : 'NO',
      'Stripe Payment Intent': transaction.stripePaymentIntentId || 'N/A',
    }));

    // Log export completion
    console.log(`✅ Export completed - ${transactions.length} transactions exported as ${format}`);

    // Generate file based on format
    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }

  // Generate Excel file
  private generateExcel(data: any[]) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 36 }, // Transaction ID
      { wch: 12 }, // Date
      { wch: 36 }, // User ID
      { wch: 25 }, // User Name
      { wch: 30 }, // User Email
      { wch: 12 }, // User DOB
      { wch: 30 }, // Street
      { wch: 20 }, // City
      { wch: 12 }, // Postal Code
      { wch: 15 }, // Country
      { wch: 15 }, // SKU Code
      { wch: 30 }, // SKU Name
      { wch: 15 }, // Payment Mode
      { wch: 12 }, // Amount
      { wch: 15 }, // Impact
      { wch: 25 }, // Merchant
      { wch: 36 }, // Partner ID
      { wch: 20 }, // Order ID
      { wch: 15 }, // Payment Status
      { wch: 12 }, // Amplivo Flag
      { wch: 30 }, // Stripe Payment Intent
    ];
    worksheet['!cols'] = columnWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  // Generate CSV file
  private generateCSV(data: any[]) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(csv, 'utf-8');
  }

  // Generate partner invoicing report
  async generatePartnerReport(partnerId: string, startDate: Date, endDate: Date, format: 'xlsx' | 'csv' = 'xlsx') {
    // Log partner report export
    console.log(`📊 Partner report export initiated - Partner: ${partnerId}, Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}, Format: ${format}`);

    const transactions = await Transaction.findAll({
      where: {
        partnerId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      include: [
        { model: User, as: 'user' },
        { model: SKU, as: 'sku' },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate totals
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalImpact = transactions.reduce((sum, t) => sum + Number(t.calculatedImpact), 0);

    // Format data
    const exportData = transactions.map(t => ({
      'Transaction ID': t.id,
      'Date': t.createdAt.toISOString().split('T')[0],
      'User Email': t.user.email,
      'SKU Code': t.sku.code,
      'Amount (EUR)': Number(t.amount).toFixed(2),
      'Impact (grams)': Number(t.calculatedImpact).toFixed(2),
      'Payment Status': t.paymentStatus,
    }));

    // Add summary row
    exportData.push({
      'Transaction ID': 'TOTAL',
      'Date': '',
      'User Email': `${totalTransactions} transactions`,
      'SKU Code': '',
      'Amount (EUR)': totalAmount.toFixed(2),
      'Impact (grams)': totalImpact.toFixed(2),
      'Payment Status': 'n/a' as any,
    });

    // Log partner report completion
    console.log(`✅ Partner report completed - ${totalTransactions} transactions, Total: €${totalAmount.toFixed(2)}, Impact: ${totalImpact.toFixed(2)}g`);

    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }
}

export default new ExportService();
