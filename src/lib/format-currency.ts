/**
 * Standardized currency formatting utility.
 * Always displays 2 decimal places for consistency across the platform.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Abbreviated currency formatting for dashboards and summaries.
 * Shows $1.2M, $450K, $1,234.56 depending on magnitude.
 */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: string = "USD"
): string {
  if (amount === null || amount === undefined) return "N/A";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 1 }).format(amount / 1_000_000)}M`;
  }
  if (abs >= 10_000) {
    return `${new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 1 }).format(amount / 1_000)}K`;
  }
  return formatCurrency(amount, currency);
}
