export type RegionCode = "IN" | "US" | "GB" | "EU" | "AE";

export interface RegionConfig {
  code: RegionCode;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  exchangeRateFromINR: number;
  locale: string;
  taxName: string;
  taxShort: string;
  taxRate: number; // e.g. 0.18 for 18%
  taxIdLabel: string;
  taxIdDefault: string;
  paymentGatewayName: string;
  paymentMethods: string[];
  paymentDesc: string;
  shippingThresholdINR: number;
  standardShippingFeeINR: number;
}

export const REGIONS: Record<RegionCode, RegionConfig> = {
  IN: {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    symbol: "₹",
    exchangeRateFromINR: 1.0,
    locale: "en-IN",
    taxName: "GST (18% — 9% CGST + 9% SGST)",
    taxShort: "GST (18%)",
    taxRate: 0.18,
    taxIdLabel: "GSTIN",
    taxIdDefault: "27AABCN8942Q1Z9",
    paymentGatewayName: "Direct UPI / Dynamic QR",
    paymentMethods: ["UPI Instant (Google Pay/PhonePe/Paytm)", "NetBanking", "Debit/Credit Card", "NEFT / RTGS"],
    paymentDesc: "0% gateway processing fee via direct NPCI UPI settlement",
    shippingThresholdINR: 2500,
    standardShippingFeeINR: 150,
  },
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    symbol: "$",
    exchangeRateFromINR: 0.0118,
    locale: "en-US",
    taxName: "US State Sales Tax (8.5%)",
    taxShort: "Sales Tax (8.5%)",
    taxRate: 0.085,
    taxIdLabel: "EIN Tax ID",
    taxIdDefault: "12-3456789 (US EIN)",
    paymentGatewayName: "Stripe Instant / ACH / Apple Pay",
    paymentMethods: ["Apple Pay", "Credit Card (Visa/Mastercard/Amex)", "ACH Direct Debit"],
    paymentDesc: "Real-time Stripe clearing with ACH automated settlement",
    shippingThresholdINR: 2500,
    standardShippingFeeINR: 150,
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    symbol: "£",
    exchangeRateFromINR: 0.0093,
    locale: "en-GB",
    taxName: "UK Value Added Tax (20% VAT)",
    taxShort: "UK VAT (20%)",
    taxRate: 0.20,
    taxIdLabel: "UK VAT No",
    taxIdDefault: "GB 987 6543 21",
    paymentGatewayName: "UK Faster Payments / Revolut",
    paymentMethods: ["Faster Payments", "Debit / Credit Card", "BACS Direct"],
    paymentDesc: "HMRC digital VAT breakdown with faster bank settlement",
    shippingThresholdINR: 2500,
    standardShippingFeeINR: 150,
  },
  EU: {
    code: "EU",
    name: "European Union",
    flag: "🇪🇺",
    currency: "EUR",
    symbol: "€",
    exchangeRateFromINR: 0.0109,
    locale: "de-DE",
    taxName: "EU Harmonized VAT (20% MwSt/TVA)",
    taxShort: "EU VAT (20%)",
    taxRate: 0.20,
    taxIdLabel: "EU VAT ID",
    taxIdDefault: "EU 372019482",
    paymentGatewayName: "SEPA Instant / Klarna / iDEAL",
    paymentMethods: ["SEPA Instant Bank Transfer", "Klarna Pay Now", "iDEAL", "Card"],
    paymentDesc: "One-Stop-Shop (OSS) EU VAT certified digital clearing",
    shippingThresholdINR: 2500,
    standardShippingFeeINR: 150,
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    symbol: "AED ",
    exchangeRateFromINR: 0.0435,
    locale: "en-AE",
    taxName: "UAE Federal VAT (5%)",
    taxShort: "UAE VAT (5%)",
    taxRate: 0.05,
    taxIdLabel: "TRN No",
    taxIdDefault: "100345678900003",
    paymentGatewayName: "Emirates Instant Pay / Apple Pay",
    paymentMethods: ["Emirates NBD Instant Pay", "Apple Pay", "Visa/Mastercard"],
    paymentDesc: "Federal Tax Authority (FTA) compliant e-invoice with TRN",
    shippingThresholdINR: 2500,
    standardShippingFeeINR: 150,
  },
};

export const DEFAULT_REGION = REGIONS.IN;

export function convertFromINR(amountINR: number, region: RegionConfig): number {
  if (isNaN(amountINR) || amountINR === null || amountINR === undefined) return 0;
  return amountINR * region.exchangeRateFromINR;
}

export function formatPriceRegional(amountINR: number, region: RegionConfig): string {
  if (isNaN(amountINR) || amountINR === null || amountINR === undefined) {
    return region.code === "IN" ? "₹0" : `${region.symbol}0.00`;
  }
  const localVal = convertFromINR(amountINR, region);
  if (region.code === "IN") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(localVal));
  }
  return new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(localVal);
}
