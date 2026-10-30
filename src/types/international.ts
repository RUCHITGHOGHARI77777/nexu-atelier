/**
 * NEXU ATELIER — International Commerce & Market Configuration Types
 */

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";

export interface CurrencyDefinition {
  code: CurrencyCode;
  symbol: string;
  name: string;
  fractionDigits: number;
}

export interface MarketCountry {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  defaultCurrency: CurrencyCode;
  isEnabled: boolean;
  shippingEligible: boolean;
  flagEmoji: string;
}

export interface ExchangeRatesConfig {
  baseCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", fractionDigits: 0 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", fractionDigits: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", fractionDigits: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", fractionDigits: 2 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", fractionDigits: 2 },
};

export const DEFAULT_MARKETS: MarketCountry[] = [
  {
    code: "IN",
    name: "India",
    defaultCurrency: "INR",
    isEnabled: true,
    shippingEligible: true,
    flagEmoji: "🇮🇳",
  },
  {
    code: "US",
    name: "United States",
    defaultCurrency: "USD",
    isEnabled: true,
    shippingEligible: true,
    flagEmoji: "🇺🇸",
  },
  {
    code: "GB",
    name: "United Kingdom",
    defaultCurrency: "GBP",
    isEnabled: true,
    shippingEligible: true,
    flagEmoji: "🇬🇧",
  },
  {
    code: "EU",
    name: "European Union",
    defaultCurrency: "EUR",
    isEnabled: true,
    shippingEligible: true,
    flagEmoji: "🇪🇺",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    defaultCurrency: "AED",
    isEnabled: true,
    shippingEligible: true,
    flagEmoji: "🇦🇪",
  },
];
