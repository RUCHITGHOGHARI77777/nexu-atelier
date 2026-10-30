/**
 * NEXU ATELIER — Smart Listing, Auto-Draft, Dynamic Attributes & SLA Types
 */

export type AttributeDataType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "DROPDOWN"
  | "MULTI_SELECT"
  | "MEASUREMENT"
  | "DATE"
  | "STRUCTURED_SPECS";

export interface CategoryAttributeDefinition {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  dataType: AttributeDataType;
  isRequired: boolean;
  allowedValues: string[];
  defaultUnit: string | null;
  allowedUnits: string[];
  validationRules: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    regex?: string;
  } | null;
  isCustomerVisible: boolean;
  isVariantAttribute: boolean;
  displayOrder: number;
}

export interface AttributeValueEntry {
  value: any;
  unit?: string | null;
}

export type ProductAttributesMap = Record<string, AttributeValueEntry>;

export interface QualityIssue {
  field: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  tip?: string;
}

export interface SmartListingQualityResult {
  score: number; // 0 - 100
  canSubmit: boolean;
  errors: QualityIssue[];
  warnings: QualityIssue[];
  suggestions: QualityIssue[];
  breakdown: {
    coreDetails: number; // Max 25
    categoryAttributes: number; // Max 25
    mediaQuality: number; // Max 20
    variantsAndStock: number; // Max 15
    pricingSanity: number; // Max 15
  };
  summary: string;
}

export interface SupplierDraftData {
  title?: string;
  subtitle?: string;
  description?: string;
  categoryId?: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  productType?: string;
  searchKeywords?: string;
  basePrice?: number;
  compareAtPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  images?: string[];
  variants?: Array<{
    sku: string;
    variantType: "COLOR" | "SIZE";
    name: string;
    value: string;
    hexCode?: string;
    imageUrl?: string;
    stock: number;
    additionalPrice: number;
  }>;
  attributes?: ProductAttributesMap;
  material?: string;
  dimensions?: string;
  weight?: string;
  careInstructions?: string;
  dispatchEstimate?: string;
  packageDimensions?: string;
  taxRatePercent?: number;
  selectedCoverIndex?: number;
}

export interface SupplierDraftRecord {
  id: string;
  sellerId: string;
  productId: string | null;
  draftKey: string;
  title: string | null;
  categoryId: string | null;
  draftData: SupplierDraftData;
  version: number;
  isSubmitted: boolean;
  updatedAt: string;
}

export interface ReviewSlaConfig {
  slaReviewMinutes: number;
  reminderIntervalsMinutes: number[];
  businessHoursOnly: boolean;
  escalationEmail: string;
  autoApprovalEnabled: boolean; // Always false by policy
}

export interface ProductSlaStatus {
  productId: string;
  productTitle: string;
  approvalStatus: string;
  submittedForReviewAt: string | null;
  slaReviewMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  isOverdue: boolean;
  overdueAt: string | null;
  slaReminderCount: number;
  lastSlaReminderAt: string | null;
}

export interface ProductRevisionRecord {
  id: string;
  productId: string;
  revisionNumber: number;
  snapshot: any;
  changedFields: string[];
  adminFeedback: string | null;
  submittedBy: string;
  createdAt: string;
}
