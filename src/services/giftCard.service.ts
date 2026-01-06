// Gift Card Service - Business logic for gift card code management

import { GiftCardCode, SKU } from '../database/models/index.js';

interface CreateGiftCardCodesData {
  codes: string[];
  skuId: string;
}

class GiftCardService {
  // Validate and redeem gift card code (one-time use enforcement)
  async validateAndRedeemCode(code: string, userId: string) {
    const giftCard = await GiftCardCode.findOne({ where: { code } });

    // Check if code exists
    if (!giftCard) {
      throw new Error('Invalid gift card code');
    }

    // Check if already redeemed (one-time use enforcement)
    if (giftCard.isRedeemed) {
      throw new Error('This gift card code has already been used');
    }

    // Mark as redeemed
    await giftCard.update({
      isRedeemed: true,
      redeemedAt: new Date(),
      redeemedBy: userId,
    });

    return giftCard;
  }

  // Bulk create gift card codes
  async createGiftCardCodes(data: CreateGiftCardCodesData) {
    // Verify SKU exists
    const sku = await SKU.findByPk(data.skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    // Create codes
    const codes = await Promise.all(
      data.codes.map(code =>
        GiftCardCode.create({
          code,
          skuId: data.skuId,
        })
      )
    );

    return codes;
  }

  // Get all gift card codes for a SKU
  async getCodesBySKU(skuId: string, redeemedOnly = false) {
    const where: any = { skuId };
    if (redeemedOnly) {
      where.isRedeemed = true;
    }

    return await GiftCardCode.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  // Get gift card code status
  async getCodeStatus(code: string) {
    const giftCard = await GiftCardCode.findOne({
      where: { code },
      include: [{ model: SKU, as: 'sku' }],
    });

    if (!giftCard) {
      throw new Error('Gift card code not found');
    }

    return giftCard;
  }

  // Get all gift card codes with filters
  async getAllCodes(filters: { isRedeemed?: boolean; skuId?: string }) {
    const where: any = {};
    if (filters.isRedeemed !== undefined) where.isRedeemed = filters.isRedeemed;
    if (filters.skuId) where.skuId = filters.skuId;

    return await GiftCardCode.findAll({
      where,
      include: [{ model: SKU, as: 'sku' }],
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new GiftCardService();
