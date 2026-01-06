import express from 'express';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

// Admin authentication routes
router.post('/login', adminController.login);
router.get('/verify', adminController.verify);
router.get('/sku', adminController.getSKU);

export default router;
