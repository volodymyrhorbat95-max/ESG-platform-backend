import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import {
  validateRequiredFields,
  validateEmail,
  validateDate,
  validateTermsAcceptance,
} from '../middleware/validation.js';

const router = Router();

// Registration endpoint - POST /api/register
router.post(
  '/register',
  validateRequiredFields([
    'firstName',
    'lastName',
    'email',
    'dateOfBirth',
    'street',
    'city',
    'postalCode',
    'country',
    'state',
    'termsAccepted',
  ]),
  validateEmail,
  validateDate('dateOfBirth'),
  validateTermsAcceptance,
  userController.register
);

// Admin user management routes
router.get('/users', userController.getAll);
router.get('/users/:id', userController.getById);
router.get('/users/email/:email', userController.getByEmail);

export default router;
