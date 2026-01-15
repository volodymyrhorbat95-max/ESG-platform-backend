// Gift Card Service - Business logic for gift card code management

import { GiftCardCode, SKU } from '../database/models/index.js';

interface CreateGiftCardCodesData {
  codes: string[];
  skuId: string;
}

interface GenerateGiftCardCodesData {
  quantity: number;
  skuId: string;
}

class GiftCardService {
  // Validate gift card code WITHOUT redeeming (Step 2: validation only)
  // This is called when user first enters the code - we verify it's valid but don't mark as used yet
  // Section 8.2: Validates code exists, not used, and matches expected SKU
  async validateCode(code: string, expectedSkuId?: string) {
    const giftCard = await GiftCardCode.findOne({
      where: { code },
      include: [{ model: SKU, as: 'sku' }],
    });

    // Check if code exists
    if (!giftCard) {
      throw new Error('Invalid gift card code');
    }

    // Check if already redeemed (one-time use enforcement)
    if (giftCard.isRedeemed) {
      throw new Error('This gift card code has already been used');
    }

    // Section 8.2 Requirement #4: Verify code matches expected SKU
    if (expectedSkuId && giftCard.skuId !== expectedSkuId) {
      throw new Error('This gift card code does not match the expected product');
    }

    // Return the gift card without redeeming - will be redeemed during transaction creation
    return giftCard;
  }

  // Validate and redeem gift card code (one-time use enforcement)
  // This is called during transaction creation - we actually mark the code as used
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

    // Mark as redeemed with the actual user ID
    await giftCard.update({
      isRedeemed: true,
      redeemedAt: new Date(),
      redeemedBy: userId,
    });

    return giftCard;
  }

  // Generate unique gift card code
  private generateUniqueCode(skuCode: string, index: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const paddedIndex = index.toString().padStart(4, '0');
    return `${skuCode}-${timestamp}-${random}-${paddedIndex}`;
  }

  // Bulk generate gift card codes (system generates unique codes)
  async generateGiftCardCodes(data: GenerateGiftCardCodesData) {
    // Verify SKU exists
    const sku = await SKU.findByPk(data.skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    if (data.quantity <= 0 || data.quantity > 1000) {
      throw new Error('Quantity must be between 1 and 1000');
    }

    // Generate unique codes
    const generatedCodes: string[] = [];
    for (let i = 0; i < data.quantity; i++) {
      generatedCodes.push(this.generateUniqueCode(sku.code, i + 1));
    }

    // Create codes in database
    const codes = await Promise.all(
      generatedCodes.map(code =>
        GiftCardCode.create({
          code,
          skuId: data.skuId,
        })
      )
    );

    return codes;
  }

  // Bulk create gift card codes (manual codes provided)
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

  // Invalidate a gift card code (admin action to disable a code)
  async invalidateCode(code: string) {
    const giftCard = await GiftCardCode.findOne({ where: { code } });

    if (!giftCard) {
      throw new Error('Gift card code not found');
    }

    // Mark as redeemed without a user - effectively invalidates it
    // redeemedBy stays undefined to indicate admin invalidation vs user redemption
    await giftCard.update({
      isRedeemed: true,
      redeemedAt: new Date(),
    });

    return giftCard;
  }

  // Invalidate multiple gift card codes (bulk invalidation)
  async invalidateCodes(codes: string[]) {
    const results = await Promise.all(
      codes.map(async (code) => {
        try {
          const giftCard = await this.invalidateCode(code);
          return { code, success: true, giftCard };
        } catch (error: any) {
          return { code, success: false, error: error.message };
        }
      })
    );

    return results;
  }
}

export default new GiftCardService();
