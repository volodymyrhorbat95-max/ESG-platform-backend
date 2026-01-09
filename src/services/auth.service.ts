// Auth Service - Handles magic link authentication logic
import { User, MagicLink } from '../database/models/index.js';
import emailService from './email.service.js';
import jwt from 'jsonwebtoken';

class AuthService {
  private jwtSecret: string;
  private magicLinkExpiryMinutes: number = 15;
  private sessionExpiryDays: number = 30;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set in environment variables');
    }
  }

  /**
   * Request a magic link for email-based authentication
   * If user doesn't exist, returns an error (user must register first)
   */
  async requestMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    // Check if user exists
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a magic link shortly.',
      };
    }

    // Invalidate any existing unused magic links for this user
    await MagicLink.update(
      { usedAt: new Date() },
      {
        where: {
          userId: user.id,
          usedAt: null,
        },
      }
    );

    // Generate new magic link token
    const token = MagicLink.generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.magicLinkExpiryMinutes);

    // Save magic link to database
    await MagicLink.create({
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
    });

    // Send magic link email
    const userName = user.firstName || undefined;
    await emailService.sendMagicLink(user.email, token, userName);

    console.log(`✅ Magic link created for user: ${user.email} (expires in ${this.magicLinkExpiryMinutes} minutes)`);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a magic link shortly.',
    };
  }

  /**
   * Verify magic link token and create session
   */
  async verifyMagicLink(token: string): Promise<{
    success: boolean;
    sessionToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      registrationLevel: string;
    };
    error?: string;
  }> {
    // Find magic link by token
    const magicLink = await MagicLink.findOne({
      where: { token },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'registrationLevel'],
        },
      ],
    });

    if (!magicLink) {
      return {
        success: false,
        error: 'Invalid or expired magic link',
      };
    }

    // Check if magic link is valid (not expired and not used)
    if (!magicLink.isValid()) {
      return {
        success: false,
        error: magicLink.usedAt ? 'This magic link has already been used' : 'This magic link has expired',
      };
    }

    // Mark magic link as used
    await magicLink.markAsUsed();

    // Get user data
    const user = (magicLink as any).user;

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      this.jwtSecret,
      {
        expiresIn: `${this.sessionExpiryDays}d`,
      }
    );

    console.log(`✅ Magic link verified for user: ${user.email} - Session created`);

    return {
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationLevel: user.registrationLevel,
      },
    };
  }

  /**
   * Verify session token (JWT)
   */
  async verifySessionToken(token: string): Promise<{
    success: boolean;
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      registrationLevel: string;
    };
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        email: string;
      };

      // Fetch fresh user data from database
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          registrationLevel: user.registrationLevel,
        },
      };
    } catch (error: any) {
      console.error('❌ JWT verification failed:', error.message);
      return {
        success: false,
        error: 'Invalid or expired session',
      };
    }
  }

  /**
   * Generate session token for a user (used after registration or magic link verification)
   */
  generateSessionToken(user: { id: string; email: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      this.jwtSecret,
      {
        expiresIn: `${this.sessionExpiryDays}d`,
      }
    );
  }

  /**
   * DEVELOPMENT ONLY: Login with email directly (bypass magic link email)
   * This allows login when email service is unavailable or domain not verified
   */
  async devLogin(
    email: string
  ): Promise<{
    success: boolean;
    sessionToken?: string;
    user?: any;
    error?: string;
  }> {
    try {
      // Find user by email
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        console.log(`❌ Dev login failed - User not found: ${email}`);
        return {
          success: false,
          error: 'User not found. Please register first.',
        };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken({
        id: user.id,
        email: user.email,
      });

      console.log(`✅ DEV LOGIN: ${email} - Session token generated`);

      return {
        success: true,
        sessionToken,
        user,
      };
    } catch (error) {
      console.error('❌ Dev login error:', error);
      throw new Error('Failed to process dev login');
    }
  }

  /**
   * Clean up expired magic links (can be run periodically)
   */
  async cleanupExpiredLinks(): Promise<number> {
    const result = await MagicLink.destroy({
      where: {
        expiresAt: {
          $lt: new Date() as any,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result} expired magic links`);
    return result;
  }
}

export default new AuthService();
