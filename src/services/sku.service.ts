// SKU Service - Business logic for SKU management
// Supports all 4 SKU types: CLAIM, PAY, GIFT_CARD, ALLOCATION
// CRITICAL: gramsWeight removed - impact calculated dynamically using CURRENT_CSR_PRICE

import { SKU, PaymentMode } from '../database/models/index.js';

interface CreateSKUData {
  code: string;
  name: string;
  price: number;
  paymentMode: PaymentMode;
  requiresValidation: boolean;
  corsairThreshold?: number;
  impactMultiplier?: number;
  productWeight?: number; // Section 5.1: Actual grams for physical products
  description?: string; // Section 5.1: Merchant-facing description
  partnerId?: string;
}

interface UpdateSKUData extends Partial<CreateSKUData> {
  isActive?: boolean;
}

class SKUService {
  // Create new SKU
  // NOTE: impactMultiplier defaults to 1.0 (standard). Only use higher values for special campaigns (e.g., 10x hero brand).
  // The old 1.6 ALLOCATION_MULTIPLIER was SUPERSEDED - all modes now use: (amount / CSR_PRICE) * multiplier
  async createSKU(data: CreateSKUData) {
    try {
      const sku = await SKU.create({
        ...data,
        corsairThreshold: data.corsairThreshold ?? 10,
        impactMultiplier: data.impactMultiplier ?? 1.0,
      });
      return sku;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`SKU code "${data.code}" already exists`);
      }
      throw error;
    }
  }

  // Get all SKUs
  async getAllSKUs(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return await SKU.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  // Get SKU by ID
  async getSKUById(id: string) {
    const sku = await SKU.findByPk(id);
    if (!sku) {
      throw new Error('SKU not found');
    }
    return sku;
  }

  // Get SKU by code (for landing page)
  async getSKUByCode(code: string) {
    const sku = await SKU.findOne({ where: { code, isActive: true } });
    if (!sku) {
      throw new Error(`SKU with code "${code}" not found or inactive`);
    }
    return sku;
  }

  // Update SKU
  async updateSKU(id: string, data: UpdateSKUData) {
    const sku = await this.getSKUById(id);
    await sku.update(data);
    return sku;
  }

  // Delete/deactivate SKU
  async deleteSKU(id: string) {
    const sku = await this.getSKUById(id);
    await sku.update({ isActive: false });
    return sku;
  }

  // Toggle SKU active status - Section 9.3
  async toggleActive(id: string, isActive: boolean) {
    const sku = await this.getSKUById(id);
    await sku.update({ isActive });
    return sku;
  }

  // Bulk import SKUs from CSV data - Section 9.3
  async bulkImportSKUs(skusData: CreateSKUData[]) {
    const results = {
      success: [] as any[],
      errors: [] as { row: number; code: string; error: string }[],
    };

    for (let i = 0; i < skusData.length; i++) {
      try {
        const sku = await this.createSKU(skusData[i]);
        results.success.push(sku);
      } catch (error: any) {
        results.errors.push({
          row: i + 1,
          code: skusData[i].code,
          error: error.message,
        });
      }
    }

    return results;
  }

  // DEPRECATED: This method uses outdated formula
  // Use transaction.service.ts calculateImpactGrams() instead which uses:
  // (amount / CURRENT_CSR_PRICE) * impactMultiplier * 1000 = grams
  calculateAllocationImpact(amount: number, multiplier: number): number {
    return amount * multiplier;
  }

  // Check if transaction should be flagged for Corsair Connect
  shouldFlagForCorsairConnect(amount: number, threshold: number): boolean {
    return amount >= threshold;
  }
}

export default new SKUService();
