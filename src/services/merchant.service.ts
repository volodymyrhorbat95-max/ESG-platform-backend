// Merchant Service - Business logic for Merchant management
// Handles merchant operations including Stripe Connect account management

import { Merchant } from '../database/models/index.js';

interface CreateMerchantData {
  name: string;
  email: string;
  stripeAccountId?: string;
}

interface UpdateMerchantData extends Partial<CreateMerchantData> {
  isActive?: boolean;
}

class MerchantService {
  // Create new merchant
  async createMerchant(data: CreateMerchantData) {
    try {
      const merchant = await Merchant.create(data);
      return merchant;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Merchant email "${data.email}" already exists`);
      }
      throw error;
    }
  }

  // Get all merchants
  async getAllMerchants(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return await Merchant.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  // Get merchant by ID
  async getMerchantById(id: string) {
    const merchant = await Merchant.findByPk(id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    return merchant;
  }

  // Update merchant
  async updateMerchant(id: string, data: UpdateMerchantData) {
    const merchant = await this.getMerchantById(id);
    await merchant.update(data);
    return merchant;
  }

  // Deactivate merchant (soft delete)
  async deleteMerchant(id: string) {
    const merchant = await this.getMerchantById(id);
    await merchant.update({ isActive: false });
    return merchant;
  }
}

export default new MerchantService();
