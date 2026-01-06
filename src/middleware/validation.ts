import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      );
    }

    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }
  }

  next();
};

/**
 * Validate date format (ISO 8601)
 */
export const validateDate = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dateValue = req.body[fieldName];

    if (dateValue) {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        throw new AppError(`Invalid date format for ${fieldName}`, 400);
      }
    }

    next();
  };
};

/**
 * Validate UUID format
 */
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidValue = req.params[paramName];
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidValue && !uuidRegex.test(uuidValue)) {
      throw new AppError(`Invalid UUID format for ${paramName}`, 400);
    }

    next();
  };
};

/**
 * Validate terms acceptance
 */
export const validateTermsAcceptance = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { termsAccepted } = req.body;

  if (termsAccepted === false || termsAccepted === undefined) {
    throw new AppError('Terms and conditions must be accepted', 400);
  }

  next();
};

/**
 * Validate SKU payment mode
 */
export const validatePaymentMode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { paymentMode } = req.body;
  const validModes = ['CLAIM', 'PAY', 'GIFT_CARD', 'ALLOCATION'];

  if (paymentMode && !validModes.includes(paymentMode)) {
    throw new AppError(
      `Invalid payment mode. Must be one of: ${validModes.join(', ')}`,
      400
    );
  }

  next();
};
