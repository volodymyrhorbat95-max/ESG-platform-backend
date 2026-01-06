import { Router } from 'express';
import walletController from '../controllers/wallet.controller.js';

const router = Router();

// User wallet routes
router.get('/user/wallet', walletController.getUserWallet);

// Merchant wallet routes
router.get('/merchant/wallet', walletController.getMerchantWallet);

// Legacy routes with ID parameters (for admin/internal use)
router.get('/user/:userId', walletController.getUserWalletById);
router.get('/merchant/:merchantId', walletController.getMerchantWalletById);

export default router;
