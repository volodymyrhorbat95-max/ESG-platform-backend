// Export Service - Generate Excel/CSV files for Amplivo submission, reconciliation, and impact reports
// CRITICAL: Platform fee percentage comes from GlobalConfig (configurable)
import * as XLSX from 'xlsx';
import { Transaction, User, SKU, Merchant, Partner } from '../database/models/index.js';
import { Op } from 'sequelize';
import configService from './config.service.js';

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
      'Corsair Connect Flag': transaction.corsairConnectFlag ? 'YES' : 'NO',
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

  // Generate Stripe reconciliation report for financial verification
  async generateStripeReconciliationReport(startDate: Date, endDate: Date, format: 'xlsx' | 'csv' = 'xlsx') {
    console.log(`📊 Stripe reconciliation report initiated - Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Get platform fee percentage from GlobalConfig (configurable)
    const platformFeePercentage = await configService.getPlatformFeePercentage();
    const platformFeeDisplay = `${(platformFeePercentage * 100).toFixed(0)}%`;

    // Fetch all transactions with Stripe payments in the period
    const transactions = await Transaction.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        stripePaymentIntentId: {
          [Op.not]: null as any,
        },
      } as any,
      include: [
        { model: Merchant, as: 'merchant', attributes: ['id', 'name', 'stripeAccountId'] },
        { model: SKU, as: 'sku', attributes: ['code', 'name', 'paymentMode'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const exportData = transactions.map(t => {
      const amount = Number(t.amount);
      const platformFee = t.merchant?.stripeAccountId ? amount * platformFeePercentage : 0;
      const merchantPayout = t.merchant?.stripeAccountId ? amount - platformFee : 0;

      return {
        'Transaction ID': t.id,
        'Date': t.createdAt.toISOString().split('T')[0],
        'Stripe Payment Intent': t.stripePaymentIntentId,
        'Payment Status': t.paymentStatus,
        'SKU Code': t.sku.code,
        'Payment Mode': t.sku.paymentMode,
        'Gross Amount (EUR)': amount.toFixed(2),
        [`Platform Fee (${platformFeeDisplay})`]: platformFee.toFixed(2),
        'Merchant Payout': merchantPayout.toFixed(2),
        'Merchant Name': t.merchant?.name || 'N/A (Direct)',
        'Merchant Stripe Account': t.merchant?.stripeAccountId || 'N/A',
        'Split Payment': t.merchant?.stripeAccountId ? 'YES' : 'NO',
      };
    });

    // Calculate totals
    const totalGross = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalPlatformFees = transactions
      .filter(t => t.merchant?.stripeAccountId)
      .reduce((sum, t) => sum + Number(t.amount) * platformFeePercentage, 0);
    const totalMerchantPayouts = transactions
      .filter(t => t.merchant?.stripeAccountId)
      .reduce((sum, t) => sum + Number(t.amount) * (1 - platformFeePercentage), 0);
    const totalDirectPayments = transactions
      .filter(t => !t.merchant?.stripeAccountId)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Add summary rows (use dynamic platform fee column name)
    const platformFeeColumn = `Platform Fee (${platformFeeDisplay})`;
    exportData.push({
      'Transaction ID': '',
      'Date': '',
      'Stripe Payment Intent': '',
      'Payment Status': '' as any,
      'SKU Code': '',
      'Payment Mode': '',
      'Gross Amount (EUR)': '',
      [platformFeeColumn]: '',
      'Merchant Payout': '',
      'Merchant Name': '',
      'Merchant Stripe Account': '',
      'Split Payment': '',
    });
    exportData.push({
      'Transaction ID': 'SUMMARY',
      'Date': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      'Stripe Payment Intent': `${transactions.length} transactions`,
      'Payment Status': '' as any,
      'SKU Code': '',
      'Payment Mode': '',
      'Gross Amount (EUR)': totalGross.toFixed(2),
      [platformFeeColumn]: totalPlatformFees.toFixed(2),
      'Merchant Payout': totalMerchantPayouts.toFixed(2),
      'Merchant Name': '',
      'Merchant Stripe Account': '',
      'Split Payment': '',
    });
    exportData.push({
      'Transaction ID': 'DIRECT PAYMENTS',
      'Date': '(No split)',
      'Stripe Payment Intent': '',
      'Payment Status': '' as any,
      'SKU Code': '',
      'Payment Mode': '',
      'Gross Amount (EUR)': totalDirectPayments.toFixed(2),
      [platformFeeColumn]: 'N/A',
      'Merchant Payout': 'N/A',
      'Merchant Name': '',
      'Merchant Stripe Account': '',
      'Split Payment': '',
    });

    console.log(`✅ Stripe reconciliation completed - ${transactions.length} transactions, Gross: €${totalGross.toFixed(2)}, Platform Fees: €${totalPlatformFees.toFixed(2)}`);

    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }

  // Generate aggregate impact report by merchant and partner
  async generateImpactReport(startDate: Date, endDate: Date, format: 'xlsx' | 'csv' = 'xlsx') {
    console.log(`📊 Impact report initiated - Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Fetch all transactions in the period
    const transactions = await Transaction.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        paymentStatus: 'COMPLETED',
      },
      include: [
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] },
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
        { model: SKU, as: 'sku', attributes: ['code', 'name', 'paymentMode'] },
      ],
    });

    // Aggregate by merchant
    const merchantStats = new Map<string, { name: string; transactions: number; amount: number; impact: number }>();
    // Aggregate by partner
    const partnerStats = new Map<string, { name: string; transactions: number; amount: number; impact: number }>();
    // Aggregate by SKU type
    const skuTypeStats = new Map<string, { transactions: number; amount: number; impact: number }>();

    let totalTransactions = 0;
    let totalAmount = 0;
    let totalImpact = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount);
      const impact = Number(t.calculatedImpact);

      totalTransactions++;
      totalAmount += amount;
      totalImpact += impact;

      // Merchant aggregation
      const merchantKey = t.merchantId || 'NO_MERCHANT';
      const merchantName = t.merchant?.name || 'Direct (No Merchant)';
      if (!merchantStats.has(merchantKey)) {
        merchantStats.set(merchantKey, { name: merchantName, transactions: 0, amount: 0, impact: 0 });
      }
      const mStat = merchantStats.get(merchantKey)!;
      mStat.transactions++;
      mStat.amount += amount;
      mStat.impact += impact;

      // Partner aggregation
      const partnerKey = t.partnerId || 'NO_PARTNER';
      const partnerName = (t as any).partner?.name || 'Direct (No Partner)';
      if (!partnerStats.has(partnerKey)) {
        partnerStats.set(partnerKey, { name: partnerName, transactions: 0, amount: 0, impact: 0 });
      }
      const pStat = partnerStats.get(partnerKey)!;
      pStat.transactions++;
      pStat.amount += amount;
      pStat.impact += impact;

      // SKU type aggregation
      const skuType = t.sku.paymentMode;
      if (!skuTypeStats.has(skuType)) {
        skuTypeStats.set(skuType, { transactions: 0, amount: 0, impact: 0 });
      }
      const sStat = skuTypeStats.get(skuType)!;
      sStat.transactions++;
      sStat.amount += amount;
      sStat.impact += impact;
    });

    // Build export data with multiple sections
    const exportData: any[] = [];

    // Overall Summary Section
    exportData.push({
      'Section': 'OVERALL SUMMARY',
      'Name': `Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      'Transactions': totalTransactions,
      'Amount (EUR)': totalAmount.toFixed(2),
      'Impact (grams)': totalImpact.toFixed(2),
      'Impact (kg)': (totalImpact / 1000).toFixed(2),
    });
    exportData.push({ 'Section': '', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });

    // By Merchant Section
    exportData.push({ 'Section': 'BY MERCHANT', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });
    Array.from(merchantStats.values())
      .sort((a, b) => b.impact - a.impact)
      .forEach(stat => {
        exportData.push({
          'Section': '',
          'Name': stat.name,
          'Transactions': stat.transactions,
          'Amount (EUR)': stat.amount.toFixed(2),
          'Impact (grams)': stat.impact.toFixed(2),
          'Impact (kg)': (stat.impact / 1000).toFixed(2),
        });
      });
    exportData.push({ 'Section': '', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });

    // By Partner Section
    exportData.push({ 'Section': 'BY PARTNER', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });
    Array.from(partnerStats.values())
      .sort((a, b) => b.impact - a.impact)
      .forEach(stat => {
        exportData.push({
          'Section': '',
          'Name': stat.name,
          'Transactions': stat.transactions,
          'Amount (EUR)': stat.amount.toFixed(2),
          'Impact (grams)': stat.impact.toFixed(2),
          'Impact (kg)': (stat.impact / 1000).toFixed(2),
        });
      });
    exportData.push({ 'Section': '', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });

    // By SKU Type Section
    exportData.push({ 'Section': 'BY SKU TYPE', 'Name': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '' });
    Array.from(skuTypeStats.entries())
      .sort((a, b) => b[1].impact - a[1].impact)
      .forEach(([type, stat]) => {
        exportData.push({
          'Section': '',
          'Name': type,
          'Transactions': stat.transactions,
          'Amount (EUR)': stat.amount.toFixed(2),
          'Impact (grams)': stat.impact.toFixed(2),
          'Impact (kg)': (stat.impact / 1000).toFixed(2),
        });
      });

    console.log(`✅ Impact report completed - Total: ${totalTransactions} transactions, €${totalAmount.toFixed(2)}, ${(totalImpact / 1000).toFixed(2)}kg impact`);

    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }

  // Generate trend analysis report with monthly breakdown
  async generateTrendAnalysisReport(startDate: Date, endDate: Date, format: 'xlsx' | 'csv' = 'xlsx') {
    console.log(`📊 Trend analysis report initiated - Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Fetch all transactions in the period
    const transactions = await Transaction.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        paymentStatus: 'COMPLETED',
      },
      include: [
        { model: SKU, as: 'sku', attributes: ['code', 'name', 'paymentMode'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Aggregate by month
    const monthlyStats = new Map<string, {
      month: string;
      transactions: number;
      amount: number;
      impact: number;
      byType: Map<string, { transactions: number; amount: number; impact: number }>;
    }>();

    transactions.forEach(t => {
      const monthKey = t.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const amount = Number(t.amount);
      const impact = Number(t.calculatedImpact);
      const skuType = t.sku.paymentMode;

      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, {
          month: monthKey,
          transactions: 0,
          amount: 0,
          impact: 0,
          byType: new Map(),
        });
      }

      const mStat = monthlyStats.get(monthKey)!;
      mStat.transactions++;
      mStat.amount += amount;
      mStat.impact += impact;

      // By type within month
      if (!mStat.byType.has(skuType)) {
        mStat.byType.set(skuType, { transactions: 0, amount: 0, impact: 0 });
      }
      const tStat = mStat.byType.get(skuType)!;
      tStat.transactions++;
      tStat.amount += amount;
      tStat.impact += impact;
    });

    // Build export data
    const exportData: any[] = [];

    // Monthly Summary Section
    exportData.push({
      'Section': 'MONTHLY TREND SUMMARY',
      'Month': '',
      'Transactions': '',
      'Amount (EUR)': '',
      'Impact (grams)': '',
      'Impact (kg)': '',
      'MoM Growth (%)': '',
    });

    let prevTransactions = 0;
    Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .forEach((stat, index) => {
        const growth = index === 0 ? 'N/A' : ((stat.transactions - prevTransactions) / prevTransactions * 100).toFixed(1) + '%';
        exportData.push({
          'Section': '',
          'Month': stat.month,
          'Transactions': stat.transactions,
          'Amount (EUR)': stat.amount.toFixed(2),
          'Impact (grams)': stat.impact.toFixed(2),
          'Impact (kg)': (stat.impact / 1000).toFixed(2),
          'MoM Growth (%)': growth,
        });
        prevTransactions = stat.transactions;
      });

    exportData.push({ 'Section': '', 'Month': '', 'Transactions': '', 'Amount (EUR)': '', 'Impact (grams)': '', 'Impact (kg)': '', 'MoM Growth (%)': '' });

    // Monthly Breakdown by SKU Type
    exportData.push({
      'Section': 'MONTHLY BY SKU TYPE',
      'Month': '',
      'Transactions': '',
      'Amount (EUR)': '',
      'Impact (grams)': '',
      'Impact (kg)': '',
      'MoM Growth (%)': '',
    });

    Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .forEach(stat => {
        exportData.push({
          'Section': stat.month,
          'Month': '',
          'Transactions': '',
          'Amount (EUR)': '',
          'Impact (grams)': '',
          'Impact (kg)': '',
          'MoM Growth (%)': '',
        });
        Array.from(stat.byType.entries())
          .sort((a, b) => b[1].impact - a[1].impact)
          .forEach(([type, tStat]) => {
            exportData.push({
              'Section': '',
              'Month': type,
              'Transactions': tStat.transactions,
              'Amount (EUR)': tStat.amount.toFixed(2),
              'Impact (grams)': tStat.impact.toFixed(2),
              'Impact (kg)': (tStat.impact / 1000).toFixed(2),
              'MoM Growth (%)': '',
            });
          });
      });

    console.log(`✅ Trend analysis completed - ${monthlyStats.size} months analyzed`);

    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }

  // Generate per-SKU performance analysis report
  async generateSKUPerformanceReport(startDate: Date, endDate: Date, format: 'xlsx' | 'csv' = 'xlsx') {
    console.log(`📊 SKU performance report initiated - Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Fetch all transactions in the period
    const transactions = await Transaction.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        paymentStatus: 'COMPLETED',
      },
      include: [
        { model: SKU, as: 'sku', attributes: ['id', 'code', 'name', 'paymentMode', 'price', 'gramsWeight'] },
        { model: Merchant, as: 'merchant', attributes: ['id', 'name'] },
      ],
    });

    // Aggregate by individual SKU
    const skuStats = new Map<string, {
      code: string;
      name: string;
      paymentMode: string;
      unitPrice: number;
      unitImpact: number;
      transactions: number;
      uniqueUsers: Set<string>;
      totalAmount: number;
      totalImpact: number;
      avgTransactionValue: number;
      merchantBreakdown: Map<string, { name: string; transactions: number; amount: number }>;
    }>();

    transactions.forEach(t => {
      const skuKey = t.skuId;
      const amount = Number(t.amount);
      const impact = Number(t.calculatedImpact);

      if (!skuStats.has(skuKey)) {
        skuStats.set(skuKey, {
          code: t.sku.code,
          name: t.sku.name,
          paymentMode: t.sku.paymentMode,
          unitPrice: Number(t.sku.price),
          unitImpact: t.sku.gramsWeight,
          transactions: 0,
          uniqueUsers: new Set(),
          totalAmount: 0,
          totalImpact: 0,
          avgTransactionValue: 0,
          merchantBreakdown: new Map(),
        });
      }

      const sStat = skuStats.get(skuKey)!;
      sStat.transactions++;
      sStat.uniqueUsers.add(t.userId);
      sStat.totalAmount += amount;
      sStat.totalImpact += impact;

      // Merchant breakdown
      const merchantKey = t.merchantId || 'DIRECT';
      const merchantName = t.merchant?.name || 'Direct (No Merchant)';
      if (!sStat.merchantBreakdown.has(merchantKey)) {
        sStat.merchantBreakdown.set(merchantKey, { name: merchantName, transactions: 0, amount: 0 });
      }
      const mStat = sStat.merchantBreakdown.get(merchantKey)!;
      mStat.transactions++;
      mStat.amount += amount;
    });

    // Calculate averages
    skuStats.forEach(stat => {
      stat.avgTransactionValue = stat.transactions > 0 ? stat.totalAmount / stat.transactions : 0;
    });

    // Build export data
    const exportData: any[] = [];

    // SKU Performance Summary
    exportData.push({
      'Section': 'SKU PERFORMANCE SUMMARY',
      'SKU Code': '',
      'SKU Name': '',
      'Payment Mode': '',
      'Unit Price (EUR)': '',
      'Transactions': '',
      'Unique Users': '',
      'Total Revenue (EUR)': '',
      'Total Impact (kg)': '',
      'Avg Transaction (EUR)': '',
      'Revenue Share (%)': '',
    });

    const totalRevenue = Array.from(skuStats.values()).reduce((sum, s) => sum + s.totalAmount, 0);

    Array.from(skuStats.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .forEach(stat => {
        const revenueShare = totalRevenue > 0 ? (stat.totalAmount / totalRevenue * 100).toFixed(1) : '0';
        exportData.push({
          'Section': '',
          'SKU Code': stat.code,
          'SKU Name': stat.name,
          'Payment Mode': stat.paymentMode,
          'Unit Price (EUR)': stat.unitPrice.toFixed(2),
          'Transactions': stat.transactions,
          'Unique Users': stat.uniqueUsers.size,
          'Total Revenue (EUR)': stat.totalAmount.toFixed(2),
          'Total Impact (kg)': (stat.totalImpact / 1000).toFixed(2),
          'Avg Transaction (EUR)': stat.avgTransactionValue.toFixed(2),
          'Revenue Share (%)': revenueShare,
        });
      });

    exportData.push({ 'Section': '', 'SKU Code': '', 'SKU Name': '', 'Payment Mode': '', 'Unit Price (EUR)': '', 'Transactions': '', 'Unique Users': '', 'Total Revenue (EUR)': '', 'Total Impact (kg)': '', 'Avg Transaction (EUR)': '', 'Revenue Share (%)': '' });

    // Top SKUs by Merchant
    exportData.push({
      'Section': 'SKU PERFORMANCE BY MERCHANT',
      'SKU Code': '',
      'SKU Name': '',
      'Payment Mode': '',
      'Unit Price (EUR)': '',
      'Transactions': '',
      'Unique Users': '',
      'Total Revenue (EUR)': '',
      'Total Impact (kg)': '',
      'Avg Transaction (EUR)': '',
      'Revenue Share (%)': '',
    });

    Array.from(skuStats.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10) // Top 10 SKUs
      .forEach(stat => {
        exportData.push({
          'Section': `${stat.code} - ${stat.name}`,
          'SKU Code': '',
          'SKU Name': '',
          'Payment Mode': '',
          'Unit Price (EUR)': '',
          'Transactions': '',
          'Unique Users': '',
          'Total Revenue (EUR)': '',
          'Total Impact (kg)': '',
          'Avg Transaction (EUR)': '',
          'Revenue Share (%)': '',
        });

        Array.from(stat.merchantBreakdown.values())
          .sort((a, b) => b.amount - a.amount)
          .forEach(mStat => {
            const skuRevenueShare = stat.totalAmount > 0 ? (mStat.amount / stat.totalAmount * 100).toFixed(1) : '0';
            exportData.push({
              'Section': '',
              'SKU Code': '',
              'SKU Name': mStat.name,
              'Payment Mode': '',
              'Unit Price (EUR)': '',
              'Transactions': mStat.transactions,
              'Unique Users': '',
              'Total Revenue (EUR)': mStat.amount.toFixed(2),
              'Total Impact (kg)': '',
              'Avg Transaction (EUR)': (mStat.amount / mStat.transactions).toFixed(2),
              'Revenue Share (%)': skuRevenueShare,
            });
          });
      });

    console.log(`✅ SKU performance report completed - ${skuStats.size} SKUs analyzed, Total Revenue: €${totalRevenue.toFixed(2)}`);

    if (format === 'xlsx') {
      return this.generateExcel(exportData);
    } else {
      return this.generateCSV(exportData);
    }
  }
}

export default new ExportService();
