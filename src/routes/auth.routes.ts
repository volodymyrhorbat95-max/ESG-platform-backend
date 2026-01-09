// Auth Routes - Authentication endpoints
import { Router } from 'express';
import authController from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/request-magic-link - Request magic link email
router.post('/auth/request-magic-link', authController.requestMagicLink);

// POST /api/auth/verify-magic-link - Verify magic link token and get session
router.post('/auth/verify-magic-link', authController.verifyMagicLink);

// POST /api/auth/verify-session - Verify existing session token
router.post('/auth/verify-session', authController.verifySession);

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/auth/logout', authController.logout);

// POST /api/auth/dev-login - DEVELOPMENT ONLY: Direct login with email (bypass magic link)
router.post('/auth/dev-login', authController.devLogin);

export default router;
