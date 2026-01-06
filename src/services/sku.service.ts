// SKU Service - Business logic for SKU management
// Supports all 4 SKU types: CLAIM, PAY, GIFT_CARD, ALLOCATION

import { SKU, PaymentMode } from '../database/models/index.js';

interface CreateSKUData {
  code: string;
  name: string;
  gramsWeight: number;
  price: number;
  paymentMode: PaymentMode;
  requiresValidation: boolean;
  amplivoThreshold?: number;
  impactMultiplier?: number;
  partnerId?: string;
}

interface UpdateSKUData extends Partial<CreateSKUData> {
  isActive?: boolean;
}

class SKUService {
  // Create new SKU
  async createSKU(data: CreateSKUData) {
    try {
      const sku = await SKU.create({
        ...data,
        amplivoThreshold: data.amplivoThreshold ?? 10,
        impactMultiplier: data.impactMultiplier ?? 1.6,
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

  // Calculate impact for ALLOCATION type
  calculateAllocationImpact(amount: number, multiplier: number): number {
    return amount * multiplier;
  }

  // Check if transaction should be flagged for Amplivo
  shouldFlagForAmplivo(amount: number, threshold: number): boolean {
    return amount >= threshold;
  }
}

export default new SKUService();
