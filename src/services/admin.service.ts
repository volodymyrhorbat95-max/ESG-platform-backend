import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

class AdminService {
  // Validate admin secret code
  validateAdminCode(code: string): boolean {
    return code === env.admin.secretCode;
  }

  // Generate JWT token for admin
  generateAdminToken(): string {
    const payload = {
      role: 'admin',
      sku: env.admin.sku,
      timestamp: Date.now(),
    };

    const token = jwt.sign(payload, env.jwt.secret, {
      expiresIn: '7d', // Token valid for 7 days
    });

    return token;
  }

  // Verify admin JWT token
  verifyAdminToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, env.jwt.secret) as {
        role: string;
        sku: string;
      };

      // Check if token has admin role
      return decoded.role === 'admin' && decoded.sku === env.admin.sku;
    } catch (error) {
      return false;
    }
  }

  // Login admin with secret code
  async loginAdmin(code: string): Promise<{ success: boolean; token?: string; error?: string }> {
    // Validate the secret code
    if (!this.validateAdminCode(code)) {
      return {
        success: false,
        error: 'Invalid admin code',
      };
    }

    // Generate JWT token
    const token = this.generateAdminToken();

    return {
      success: true,
      token,
    };
  }
}

export default new AdminService();
