// SKU Localization Service - Business logic for multi-market SKU support
import { SKU, SKULocalization } from '../database/models/index.js';

interface LocalizationData {
  locale: string;
  localizedName: string;
  localizedDescription?: string;
  localizedTerminology?: string;
  currency: string;
  localizedPrice: number;
}

class SKULocalizationService {
  // Create a new localization for a SKU
  async createLocalization(skuId: string, data: LocalizationData) {
    // Verify SKU exists
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    // Check if localization already exists for this locale
    const existing = await SKULocalization.findOne({
      where: { skuId, locale: data.locale },
    });
    if (existing) {
      throw new Error(`Localization for locale ${data.locale} already exists`);
    }

    const localization = await SKULocalization.create({
      skuId,
      ...data,
    });

    console.log(`✅ SKU localization created - SKU: ${sku.code}, Locale: ${data.locale}, Currency: ${data.currency}`);
    return localization;
  }

  // Get all localizations for a SKU
  async getLocalizationsBySKU(skuId: string) {
    const localizations = await SKULocalization.findAll({
      where: { skuId, isActive: true },
      order: [['locale', 'ASC']],
    });
    return localizations;
  }

  // Get localization for a specific locale
  async getLocalizationByLocale(skuId: string, locale: string) {
    const localization = await SKULocalization.findOne({
      where: { skuId, locale, isActive: true },
    });
    return localization;
  }

  // Get SKU with localization for a specific market
  async getSKUForMarket(skuCode: string, locale: string) {
    const sku = await SKU.findOne({
      where: { code: skuCode, isActive: true },
      include: [
        {
          model: SKULocalization,
          as: 'localizations',
          where: { locale, isActive: true },
          required: false,
        },
      ],
    });

    if (!sku) {
      throw new Error('SKU not found');
    }

    // If localization exists, merge it with base SKU data
    const localizations = (sku as any).localizations || [];
    const localization = localizations[0];

    return {
      id: sku.id,
      code: sku.code,
      name: localization?.localizedName || sku.name,
      description: localization?.localizedDescription || null,
      terminology: localization?.localizedTerminology || null,
      gramsWeight: sku.gramsWeight,
      price: localization?.localizedPrice || sku.price,
      currency: localization?.currency || 'EUR',
      paymentMode: sku.paymentMode,
      requiresValidation: sku.requiresValidation,
      impactMultiplier: sku.impactMultiplier,
      locale: localization?.locale || 'en-US',
      hasLocalization: !!localization,
    };
  }

  // Update a localization
  async updateLocalization(id: string, updates: Partial<LocalizationData>) {
    const localization = await SKULocalization.findByPk(id);
    if (!localization) {
      throw new Error('Localization not found');
    }

    await localization.update(updates);
    console.log(`✅ SKU localization updated - ID: ${id}, Locale: ${localization.locale}`);
    return localization;
  }

  // Delete (deactivate) a localization
  async deleteLocalization(id: string) {
    const localization = await SKULocalization.findByPk(id);
    if (!localization) {
      throw new Error('Localization not found');
    }

    await localization.update({ isActive: false });
    console.log(`✅ SKU localization deactivated - ID: ${id}`);
    return localization;
  }

  // Get all available locales across all SKUs
  async getAvailableLocales() {
    const localizations = await SKULocalization.findAll({
      where: { isActive: true },
      attributes: ['locale', 'currency'],
      group: ['locale', 'currency'],
    });

    return localizations.map((l) => ({
      locale: l.locale,
      currency: l.currency,
    }));
  }

  // Bulk create localizations for a SKU (for new market entry)
  async bulkCreateLocalizations(skuId: string, localizations: LocalizationData[]) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const created = await Promise.all(
      localizations.map(async (data) => {
        try {
          return await this.createLocalization(skuId, data);
        } catch (error) {
          console.error(`Failed to create localization for locale ${data.locale}:`, error);
          return null;
        }
      })
    );

    const successful = created.filter(Boolean);
    console.log(`✅ Bulk localization complete - SKU: ${sku.code}, Created: ${successful.length}/${localizations.length}`);
    return successful;
  }
}

export default new SKULocalizationService();
