// Config Service - Manage global configuration (CURRENT_CSR_PRICE, etc.)
import { GlobalConfig } from '../database/models/index.js';

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
   * Set configuration value by key (admin only)
   * @param key - Configuration key
   * @param value - New value (stored as string)
   * @param description - Optional description
   */
  async setValue(key: string, value: string, description?: string): Promise<GlobalConfig> {
    const [config, created] = await GlobalConfig.findOrCreate({
      where: { key },
      defaults: { key, value, description },
    });

    if (!created) {
      // Update existing config
      config.value = value;
      if (description) {
        config.description = description;
      }
      await config.save();
    }

    return config;
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
    if (key === 'CURRENT_CSR_PRICE') {
      throw new Error('Cannot delete CURRENT_CSR_PRICE - this is a critical configuration');
    }

    await config.destroy();
  }
}

export default new ConfigService();
