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
 * Format a number with thousand separators (dots) but without currency symbol.
 * Useful for input fields.
 */
export function formatNumberWithSeparators(value: number | string): string {
  const num = typeof value === 'string' ? Number(value.replace(/\D/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parse a currency/formatted string back to a number.
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and dots (as separators)
  // then convert comma to dot for decimal if any (though we mostly use integers here)
  return Number(value.replace(/[^0-9,-]+/g, '').replace(/\./g, '').replace(',', '.'));
}
