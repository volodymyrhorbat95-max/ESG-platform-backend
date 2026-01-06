/**
 * Utility functions for data validation
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate date string
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0;
};

/**
 * Validate payment mode
 */
export const isValidPaymentMode = (mode: string): boolean => {
  const validModes = ['CLAIM', 'PAY', 'GIFT_CARD', 'ALLOCATION'];
  return validModes.includes(mode);
};

/**
 * Validate payment status
 */
export const isValidPaymentStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'completed', 'failed', 'n/a'];
  return validStatuses.includes(status);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim();
};

/**
 * Validate required fields
 */
export const hasRequiredFields = (
  obj: Record<string, any>,
  fields: string[]
): boolean => {
  return fields.every((field) => obj[field] !== undefined && obj[field] !== null);
};
