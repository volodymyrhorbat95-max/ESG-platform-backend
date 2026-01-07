// Shareable Link Controller - HTTP handling for secure dashboard sharing
import { Request, Response, NextFunction } from 'express';
import shareableLinkService from '../services/shareable-link.service.js';

class ShareableLinkController {
  // POST /api/users/:userId/share - Create shareable link
  async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { expiresInDays, isPublic } = req.body;

      const link = await shareableLinkService.createLink(userId, {
        expiresInDays,
        isPublic,
      });

      const shareUrl = shareableLinkService.getShareUrl(link.token);

      res.status(201).json({
        success: true,
        data: {
          id: link.id,
          token: link.token,
          shareUrl,
          expiresAt: link.expiresAt,
          isPublic: link.isPublic,
        },
        message: 'Shareable link created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/share/:token - Get shared dashboard data (public endpoint)
  async getSharedDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const data = await shareableLinkService.getSharedDashboardData(token);
      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (error.message === 'Link not found' || error.message === 'Link has expired') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  // GET /api/users/:userId/share - Get all links for user
  async getUserLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const links = await shareableLinkService.getUserLinks(userId);

      const linksWithUrls = links.map((link) => ({
        id: link.id,
        token: link.token,
        shareUrl: shareableLinkService.getShareUrl(link.token),
        expiresAt: link.expiresAt,
        isPublic: link.isPublic,
        viewCount: link.viewCount,
        lastViewedAt: link.lastViewedAt,
        createdAt: link.createdAt,
        isValid: link.isValid(),
      }));

      res.json({
        success: true,
        data: linksWithUrls,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:userId/share/:linkId - Delete a link
  async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, linkId } = req.params;
      await shareableLinkService.deleteLink(linkId, userId);
      res.json({
        success: true,
        message: 'Link deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:userId/share/:linkId - Update link settings
  async updateLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, linkId } = req.params;
      const { isPublic, expiresInDays } = req.body;

      const link = await shareableLinkService.updateLink(linkId, userId, {
        isPublic,
        expiresInDays,
      });

      res.json({
        success: true,
        data: {
          id: link.id,
          token: link.token,
          shareUrl: shareableLinkService.getShareUrl(link.token),
          expiresAt: link.expiresAt,
          isPublic: link.isPublic,
        },
        message: 'Link updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:userId/share - Revoke all links
  async revokeAllLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await shareableLinkService.revokeAllLinks(userId);
      res.json({
        success: true,
        data: result,
        message: 'All links revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ShareableLinkController();
