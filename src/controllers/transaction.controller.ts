// Transaction Controller - NO business logic, only HTTP handling
import { Request, Response, NextFunction } from 'express';
import transactionService from '../services/transaction.service.js';
import { PaymentStatus } from '../database/models/Transaction.js';

class TransactionController {
  // POST /api/transactions - Create transaction (handles all 4 SKU types)
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.createTransaction(req.body);
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/transactions/:id - Get transaction by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/transactions/user/:userId - Get transactions for a user
  async getByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await transactionService.getTransactionsByUserId(req.params.userId);
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/transactions/user/:userId/total-impact - Get user's total impact
  async getUserTotalImpact(req: Request, res: Response, next: NextFunction) {
    try {
      const totalImpact = await transactionService.getUserTotalImpact(req.params.userId);
      res.json({
        success: true,
        data: { totalImpact },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/transactions/merchant/:merchantId - Get transactions for a merchant
  async getByMerchantId(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await transactionService.getTransactionsByMerchantId(req.params.merchantId);
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/transactions - Get all transactions with filters
  // Supports filtering by all 3 attribution IDs: masterId, merchantId, partnerId
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        userId: req.query.userId as string | undefined,
        masterId: req.query.masterId as string | undefined,
        merchantId: req.query.merchantId as string | undefined,
        partnerId: req.query.partnerId as string | undefined,
        paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
        corsairConnectFlag: req.query.corsairConnectFlag === 'true' ? true : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const transactions = await transactionService.getAllTransactions(filters);
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/transactions/:id/payment-status - Update payment status (Stripe webhook)
  async updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentStatus, stripePaymentIntentId } = req.body;
      const transaction = await transactionService.updatePaymentStatus(
        req.params.id,
        paymentStatus,
        stripePaymentIntentId
      );
      res.json({
        success: true,
        data: transaction,
        message: 'Payment status updated',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/transactions/manual - Create manual transaction (admin only) - Section 9.5
  async createManual(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, skuCode, amount, merchantId, partnerId, orderId, reason } = req.body;

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      if (!skuCode) {
        return res.status(400).json({
          success: false,
          error: 'SKU code is required',
        });
      }

      if (amount === undefined || amount === null) {
        return res.status(400).json({
          success: false,
          error: 'Amount is required',
        });
      }

      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number',
        });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Reason is required for manual transactions',
        });
      }

      // Get admin identifier from request
      const createdBy = (req as any).adminEmail || 'admin';

      const transaction = await transactionService.createManualTransaction({
        userId,
        skuCode,
        amount: amountNum,
        merchantId,
        partnerId,
        orderId,
        reason: reason.trim(),
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Manual transaction created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
