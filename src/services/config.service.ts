// Config Service - Manage global configuration (CURRENT_CSR_PRICE, etc.)
import { GlobalConfig, ConfigAuditLog } from '../database/models/index.js';

class ConfigService {
  /**
   * Get configuration value by key
   * @param key - Configuration key (e.g., 'CURRENT_CSR_PRICE')
   * @returns Configuration value as string
   */
  async getValue(key: string): Promise<string> {
    const config = await GlobalConfig.findOne({ where: { key } });

    if (!config) {
      throw new Error(`Configuration key '${key}' not found`);
    }

    return config.value;
  }

  /**
   * Get CURRENT_CSR_PRICE as a number
   * This is the most frequently used config value for impact calculations
   * @returns Current price per kg in EUR (e.g., 0.11)
   */
  async getCurrentCSRPrice(): Promise<number> {
    const value = await this.getValue('CURRENT_CSR_PRICE');
    const price = parseFloat(value);

    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid CURRENT_CSR_PRICE value: ${value}`);
    }

    return price;
  }

  /**
   * Get PLATFORM_FEE_PERCENTAGE as a number
   * Used for Stripe split payments - CSR26 takes this percentage, merchant gets the rest
   * @returns Platform fee as decimal (e.g., 0.10 for 10%)
   */
  async getPlatformFeePercentage(): Promise<number> {
    const value = await this.getValue('PLATFORM_FEE_PERCENTAGE');
    const percentage = parseFloat(value);

    if (isNaN(percentage) || percentage < 0 || percentage > 1) {
      throw new Error(`Invalid PLATFORM_FEE_PERCENTAGE value: ${value}. Must be between 0 and 1.`);
    }

    return percentage;
  }

  /**
   * Get MASTER_ID - Marcello's ID for overall network tracking
   * Every transaction must record this ID for attribution
   * @returns Master ID string
   */
  async getMasterId(): Promise<string> {
    const value = await this.getValue('MASTER_ID');

    if (!value || value.trim() === '') {
      throw new Error('MASTER_ID is not configured. Please set it in the admin panel.');
    }

    return value;
  }

  /**
   * Get ALLOCATION_MULTIPLIER for ALLOCATION payment mode
   * Used in special impact formula: Impact (kg) = Amount (€) × ALLOCATION_MULTIPLIER
   * @returns Allocation multiplier as number (e.g., 1.6)
   */
  async getAllocationMultiplier(): Promise<number> {
    const value = await this.getValue('ALLOCATION_MULTIPLIER');
    const multiplier = parseFloat(value);

    if (isNaN(multiplier) || multiplier <= 0) {
      throw new Error(`Invalid ALLOCATION_MULTIPLIER value: ${value}`);
    }

    return multiplier;
  }

  /**
   * Get CORSAIR_THRESHOLD - Minimum transaction amount for Corsair Connect flag
   * Transactions >= this amount set corsairConnectFlag = true on user
   * @returns Threshold amount in euros (e.g., 10.00)
   */
  async getCorsairThreshold(): Promise<number> {
    const value = await this.getValue('CORSAIR_THRESHOLD');
    const threshold = parseFloat(value);

    if (isNaN(threshold) || threshold <= 0) {
      throw new Error(`Invalid CORSAIR_THRESHOLD value: ${value}`);
    }

    return threshold;
  }

  /**
   * Set configuration value by key (admin only)
   * @param key - Configuration key
   * @param value - New value (stored as string)
   * @param description - Optional description
   * @param changedBy - Admin who made the change (email or ID)
   */
  async setValue(key: string, value: string, description?: string, changedBy?: string): Promise<GlobalConfig> {
    // Get old value for audit log
    const existingConfig = await GlobalConfig.findOne({ where: { key } });
    const oldValue = existingConfig ? existingConfig.value : null;

    const [config, created] = await GlobalConfig.findOrCreate({
      where: { key },
      defaults: { key, value, description },
    });

    if (!created) {
      // Update existing config
      config.value = value;
      if (description !== undefined) {
        config.description = description;
      }
      await config.save();
    }

    // Log change to audit table
    if (changedBy) {
      await ConfigAuditLog.create({
        configKey: key,
        oldValue,
        newValue: value,
        changedBy,
      });
    }

    return config;
  }

  /**
   * Get configuration change history for a specific key
   * @param key - Configuration key
   * @returns Array of audit log entries, newest first
   */
  async getConfigHistory(key: string): Promise<ConfigAuditLog[]> {
    return await ConfigAuditLog.findAll({
      where: { configKey: key },
      order: [['changedAt', 'DESC']],
    });
  }

  /**
   * Get all configuration key-value pairs
   * @returns Array of all config entries
   */
  async getAllConfig(): Promise<GlobalConfig[]> {
    return await GlobalConfig.findAll({
      order: [['key', 'ASC']],
    });
  }

  /**
   * Delete configuration by key (use with caution)
   * @param key - Configuration key to delete
   */
  async deleteConfig(key: string): Promise<void> {
    const config = await GlobalConfig.findOne({ where: { key } });

    if (!config) {
      throw new Error(`Configuration key '${key}' not found`);
    }

    // Prevent deletion of critical config
    const criticalKeys = ['CURRENT_CSR_PRICE', 'PLATFORM_FEE_PERCENTAGE', 'MASTER_ID'];
    if (criticalKeys.includes(key)) {
      throw new Error(`Cannot delete ${key} - this is a critical configuration`);
    }

    await config.destroy();
  }
}

export default new ConfigService();
