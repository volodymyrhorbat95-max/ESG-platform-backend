import { Router } from 'express';
import walletController from '../controllers/wallet.controller.js';
import { requireAuth } from '../middleware/userAuth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = Router();

// User wallet routes - PROTECTED: Requires JWT authentication
router.get('/user/wallet', requireAuth, walletController.getUserWallet);

// Merchant wallet routes - For now, not protected (TODO: implement merchant auth)
router.get('/merchant/wallet', walletController.getMerchantWallet);

// Admin-only routes with ID parameters (for admin panel)
router.get('/user/:userId', requireAdmin, walletController.getUserWalletById);
router.get('/merchant/:merchantId', requireAdmin, walletController.getMerchantWalletById);

export default router;
