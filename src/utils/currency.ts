/**
 * Currency Formatting Utilities
 * All internal monetary calculations operate on integer paise.
 */

/**
 * Formats integer paise into standard Indian Rupee representation (e.g. 12000 paise -> "₹120.00" or "₹120")
 */
export function formatINR(paise: number, includeDecimals = true): string {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export const formatPaiseToINR = formatINR;

/**
 * Converts rupee decimal input (e.g. 12.50) into integer paise (1250)
 */
export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise into rupee decimal for form inputs
 */
export function paiseToRupees(paise: number): number {
  return (paise || 0) / 100;
}
