// ============================================================
// FinanceMe — Currency Formatter
// ============================================================

/**
 * Format a number as Indonesian Rupiah (IDR) by default,
 * or any other currency specified.
 */
export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a currency string back to a number.
 */
export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'));
}
