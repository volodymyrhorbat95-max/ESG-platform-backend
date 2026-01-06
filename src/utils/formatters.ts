/**
 * Utility functions for data formatting
 */

/**
 * Convert grams to kilograms
 */
export const gramsToKilograms = (grams: number): number => {
  return grams / 1000;
};

/**
 * Convert kilograms to grams
 */
export const kilogramsToGrams = (kilograms: number): number => {
  return kilograms * 1000;
};

/**
 * Format impact value for display (grams or kilograms based on size)
 */
export const formatImpact = (grams: number): string => {
  if (grams >= 1000) {
    return `${gramsToKilograms(grams).toFixed(2)} kg`;
  }
  return `${grams} g`;
};

/**
 * Format currency (EUR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse date from string
 */
export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
};

/**
 * Calculate impact using multiplier formula
 * Used for ALLOCATION type SKUs
 */
export const calculateImpactWithMultiplier = (
  amount: number,
  multiplier: number
): number => {
  return Math.round(amount * multiplier * 100) / 100;
};
