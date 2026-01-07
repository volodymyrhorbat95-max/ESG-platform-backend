// Shareable Link Service - Business logic for secure dashboard sharing
import { ShareableLink, User, Wallet, Transaction, SKU } from '../database/models/index.js';

interface CreateLinkOptions {
  expiresInDays?: number;
  isPublic?: boolean;
}

class ShareableLinkService {
  // Create a new shareable link for a user's dashboard
  async createLink(userId: string, options: CreateLinkOptions = {}) {
    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate expiration date if specified
    let expiresAt: Date | undefined;
    if (options.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
    }

    // Generate secure token
    const token = ShareableLink.generateToken();

    const link = await ShareableLink.create({
      userId,
      token,
      expiresAt,
      isPublic: options.isPublic !== false, // Default to public
    });

    console.log(`✅ Shareable link created - User: ${user.email}, Token: ${token.substring(0, 8)}..., Expires: ${expiresAt || 'Never'}`);
    return link;
  }

  // Get link by token (for viewing shared dashboard)
  async getLinkByToken(token: string) {
    const link = await ShareableLink.findOne({
      where: { token },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!link) {
      throw new Error('Link not found');
    }

    // Check if link is expired
    if (!link.isValid()) {
      throw new Error('Link has expired');
    }

    // Increment view count and update last viewed
    await link.update({
      viewCount: link.viewCount + 1,
      lastViewedAt: new Date(),
    });

    return link;
  }

  // Get user's dashboard data via shareable link
  async getSharedDashboardData(token: string) {
    const link = await this.getLinkByToken(token);
    const user = (link as any).user;

    // Fetch wallet data
    const wallet = await Wallet.findOne({
      where: { userId: link.userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Fetch transactions
    const transactions = await Transaction.findAll({
      where: { userId: link.userId },
      include: [
        { model: SKU, as: 'sku', attributes: ['code', 'name', 'paymentMode'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Calculate impact metrics
    const totalImpact = Number(wallet.totalAccumulated);
    const currentBalance = Number(wallet.currentBalance);
    const plasticBottles = Math.floor(totalImpact / 25); // 25g per bottle

    return {
      user: {
        firstName: user.firstName,
        // Only show first name for privacy
      },
      wallet: {
        currentBalance,
        currentBalanceKg: (currentBalance / 1000).toFixed(3),
        totalAccumulated: totalImpact,
        totalAccumulatedKg: (totalImpact / 1000).toFixed(3),
      },
      impact: {
        plasticBottles,
        totalGrams: totalImpact,
        totalKg: (totalImpact / 1000).toFixed(3),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.createdAt.toISOString().split('T')[0],
        skuName: t.sku.name,
        impact: Number(t.calculatedImpact),
        impactKg: (Number(t.calculatedImpact) / 1000).toFixed(3),
      })),
      transactionCount: transactions.length,
      linkStats: {
        viewCount: link.viewCount,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
      },
    };
  }

  // Get all links for a user
  async getUserLinks(userId: string) {
    const links = await ShareableLink.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return links;
  }

  // Delete a shareable link
  async deleteLink(id: string, userId: string) {
    const link = await ShareableLink.findOne({
      where: { id, userId },
    });

    if (!link) {
      throw new Error('Link not found');
    }

    await link.destroy();
    console.log(`✅ Shareable link deleted - ID: ${id}`);
    return { success: true };
  }

  // Revoke all links for a user
  async revokeAllLinks(userId: string) {
    const result = await ShareableLink.destroy({
      where: { userId },
    });
    console.log(`✅ All shareable links revoked for user - Count: ${result}`);
    return { deletedCount: result };
  }

  // Update link settings
  async updateLink(id: string, userId: string, updates: { isPublic?: boolean; expiresInDays?: number }) {
    const link = await ShareableLink.findOne({
      where: { id, userId },
    });

    if (!link) {
      throw new Error('Link not found');
    }

    const updateData: any = {};
    if (updates.isPublic !== undefined) {
      updateData.isPublic = updates.isPublic;
    }
    if (updates.expiresInDays !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + updates.expiresInDays);
      updateData.expiresAt = expiresAt;
    }

    await link.update(updateData);
    console.log(`✅ Shareable link updated - ID: ${id}`);
    return link;
  }

  // Generate share URL
  getShareUrl(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/share/${token}`;
  }
}

export default new ShareableLinkService();
