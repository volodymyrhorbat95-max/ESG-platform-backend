// Partner Service - Business logic for Partner management
// Handles partner operations for tracking and monthly billing

import { Partner } from '../database/models/index.js';

interface CreatePartnerData {
  name: string;
  email: string;
  contactPerson: string;
  phone?: string;
  billingAddress?: string;
}

interface UpdatePartnerData extends Partial<CreatePartnerData> {
  isActive?: boolean;
}

class PartnerService {
  // Create new partner
  async createPartner(data: CreatePartnerData) {
    try {
      const partner = await Partner.create({
        name: data.name,
        email: data.email,
        contactPerson: data.contactPerson,
        phone: data.phone || '',
        billingAddress: data.billingAddress || '',
        isActive: true,
      });
      return partner;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Partner name "${data.name}" already exists`);
      }
      throw error;
    }
  }

  // Get all partners
  async getAllPartners(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return await Partner.findAll({
      where,
      order: [['name', 'ASC']]
    });
  }

  // Get partner by ID
  async getPartnerById(id: string) {
    const partner = await Partner.findByPk(id);
    if (!partner) {
      throw new Error('Partner not found');
    }
    return partner;
  }

  // Update partner
  async updatePartner(id: string, data: UpdatePartnerData) {
    const partner = await this.getPartnerById(id);
    await partner.update(data);
    return partner;
  }

  // Deactivate partner (soft delete)
  async deactivatePartner(id: string) {
    const partner = await this.getPartnerById(id);
    await partner.update({ isActive: false });
    return partner;
  }
}

export default new PartnerService();
