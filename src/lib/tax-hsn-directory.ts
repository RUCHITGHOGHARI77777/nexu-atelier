/**
 * NEXU ATELIER — Statutory HSN Tax Directory & Official GST Classification Engine
 *
 * References:
 * - Central Board of Indirect Taxes and Customs (CBIC): https://cbic-gst.gov.in
 * - GST Council CGST Rate Notifications: https://www.gstcouncil.gov.in/cgst-rate-notification
 * - Notification No. 13/2025-Central Tax (Rate), dated 17 September 2025 (Handicrafts & Artisan Crafts)
 * - Notification No. 1/2017-Central Tax (Rate), dated 28 June 2017 (as amended)
 */

export interface HsnTaxRecord {
  hsnCode: string;
  category: string;
  description: string;
  defaultRatePercent: number; // 5, 12, or 18
  concessionalRatePercent?: number;
  conditionDescription?: string;
  notificationRef: string;
  effectiveDate: string;
  isHandicraftEligible: boolean;
  requiresReview?: boolean;
}

export const HSN_TAX_DIRECTORY: HsnTaxRecord[] = [
  {
    hsnCode: "5007",
    category: "Heritage Textiles",
    description: "Woven fabrics of silk or silk waste (Pure Chanderi, Mulberry, Tussar, Ahimsa silk)",
    defaultRatePercent: 5.0,
    notificationRef: "Notification 1/2017-CT(R), Sched I, Entry 205",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "5208",
    category: "Heritage Textiles",
    description: "Woven fabrics of cotton containing >= 85% cotton (Handloom Khadi, Mulmul cotton)",
    defaultRatePercent: 5.0,
    notificationRef: "Notification 1/2017-CT(R), Sched I, Entry 214",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "6204",
    category: "Apparel & Garments",
    description: "Women's or girls' suits, dresses, skirts, robes, anarkalis of textile materials",
    defaultRatePercent: 12.0,
    concessionalRatePercent: 5.0,
    conditionDescription: "5% if sale value <= ₹1,000 per piece; 12% if sale value > ₹1,000",
    notificationRef: "Notification 1/2017-CT(R) as amended / Council Decision",
    effectiveDate: "2022-01-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "6203",
    category: "Apparel & Garments",
    description: "Men's or boys' jackets, blazers, trousers, kurtas, bandhgalas",
    defaultRatePercent: 12.0,
    concessionalRatePercent: 5.0,
    conditionDescription: "5% if sale value <= ₹1,000 per piece; 12% if sale value > ₹1,000",
    notificationRef: "Notification 1/2017-CT(R) as amended",
    effectiveDate: "2022-01-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "7418",
    category: "Brass & Metal Art",
    description: "Table, kitchen or household articles of brass, copper, bronze (Lost-wax Urli, Pooja bell)",
    defaultRatePercent: 12.0,
    concessionalRatePercent: 12.0,
    conditionDescription: "Artisanal lost-wax brass craft recognized under Handicrafts Schedule",
    notificationRef: "Notification 13/2025-Central Tax (Rate), dated 17 September 2025",
    effectiveDate: "2025-09-17",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "7419",
    category: "Brass & Metal Art",
    description: "Other articles of brass / copper handicrafts (Sculptures, Dhokra art, heritage panels)",
    defaultRatePercent: 12.0,
    notificationRef: "Notification 13/2025-Central Tax (Rate), dated 17 September 2025",
    effectiveDate: "2025-09-17",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "6912",
    category: "Ceramics & Tableware",
    description: "Ceramic tableware, kitchenware, other household articles, stoneware pottery",
    defaultRatePercent: 12.0,
    concessionalRatePercent: 5.0,
    conditionDescription: "5% for earthen clay / terracotta pottery (Notification 1/2017-CT(R) Entry 135B)",
    notificationRef: "Notification 1/2017-CT(R) Sched II, Entry 178",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "6913",
    category: "Ceramics & Tableware",
    description: "Statuettes and other ornamental ceramic articles (Table lamps, sculptures, glazed pottery)",
    defaultRatePercent: 12.0,
    notificationRef: "Notification 13/2025-Central Tax (Rate), dated 17 September 2025",
    effectiveDate: "2025-09-17",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "6403",
    category: "Footwear & Leathercraft",
    description: "Footwear with outer soles of rubber, plastics, leather (Kolhapuri sandals, leather mojari)",
    defaultRatePercent: 12.0,
    concessionalRatePercent: 5.0,
    conditionDescription: "5% if sale value <= ₹1,000 per pair; 12% if sale value > ₹1,000",
    notificationRef: "Notification 1/2017-CT(R) Sched II, Entry 171",
    effectiveDate: "2022-01-01",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "7113",
    category: "Fine Jewelry",
    description: "Articles of jewelry and parts thereof of precious metal (Silver filigree, gold jewelry)",
    defaultRatePercent: 3.0,
    notificationRef: "Notification 1/2017-CT(R) Sched IV (Precious Metals)",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: true,
    requiresReview: true,
  },
  {
    hsnCode: "7117",
    category: "Fine Jewelry",
    description: "Imitation jewelry (Tribal brass, beaded, hand-enameled meenakari jewelry)",
    defaultRatePercent: 12.0,
    notificationRef: "Notification 13/2025-Central Tax (Rate), dated 17 September 2025",
    effectiveDate: "2025-09-17",
    isHandicraftEligible: true,
  },
  {
    hsnCode: "8518",
    category: "Acoustics & Technology",
    description: "Microphones, loudspeakers, headphones, earphones, audio amplifiers (Acoustic monitors)",
    defaultRatePercent: 18.0,
    notificationRef: "Notification 1/2017-CT(R) Sched III, Entry 374",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: false,
  },
  {
    hsnCode: "8504",
    category: "Acoustics & Technology",
    description: "Electrical transformers, static converters (chargers, power bricks, GaN stations)",
    defaultRatePercent: 18.0,
    notificationRef: "Notification 1/2017-CT(R) Sched III, Entry 370",
    effectiveDate: "2017-07-01",
    isHandicraftEligible: false,
  },
];

/**
 * Find HSN classification record by code or query string.
 */
export function lookupHsn(codeOrQuery: string): HsnTaxRecord | undefined {
  if (!codeOrQuery) return undefined;
  const clean = codeOrQuery.trim().toLowerCase();
  
  const exact = HSN_TAX_DIRECTORY.find((r) => r.hsnCode === clean || r.hsnCode.startsWith(clean));
  if (exact) return exact;

  return HSN_TAX_DIRECTORY.find(
    (r) =>
      r.description.toLowerCase().includes(clean) ||
      r.category.toLowerCase().includes(clean)
  );
}

/**
 * Suggest applicable GST rate based on HSN code and unit price in INR.
 */
export function suggestGstRateForHsn(hsnCode: string, unitPriceINR: number = 0): {
  ratePercent: number;
  record: HsnTaxRecord | null;
  ruleExplanation: string;
} {
  const record = lookupHsn(hsnCode);
  if (!record) {
    return {
      ratePercent: 12.0, // Standard fallback
      record: null,
      ruleExplanation: "Unclassified HSN. Standard 12% atelier GST applied pending review.",
    };
  }

  if (record.concessionalRatePercent && record.conditionDescription) {
    if (unitPriceINR > 0 && unitPriceINR <= 1000) {
      return {
        ratePercent: record.concessionalRatePercent,
        record,
        ruleExplanation: `${record.hsnCode}: Concessional ${record.concessionalRatePercent}% applies for unit value <= ₹1,000 (${record.notificationRef}).`,
      };
    }
  }

  return {
    ratePercent: record.defaultRatePercent,
    record,
    ruleExplanation: `${record.hsnCode}: Standard ${record.defaultRatePercent}% applies (${record.notificationRef}).`,
  };
}

