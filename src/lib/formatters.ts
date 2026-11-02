import { RegionConfig, formatPriceRegional, DEFAULT_REGION, REGIONS } from "./currency";

export * from "./currency";

/**
 * Formats currency values based on active region or defaults to Indian Rupee.
 */
export function formatCurrency(amount: number, region?: RegionConfig | null): string {
  if (isNaN(amount)) return "₹0";
  if (region) {
    return formatPriceRegional(amount, region);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates discount percentage cleanly.
 */
export function calculateDiscountPercentage(basePrice: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= basePrice) return 0;
  return Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100);
}

/**
 * Formats ISO date or timestamp strings into human readable strings.
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Formats date into simple calendar string (e.g. 29 Oct 2026).
 */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
