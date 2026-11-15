export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ProductApprovalStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "ARCHIVED";
export type FulfillmentStatus = "NEW" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PayoutStatus = "ESCROW_HOLD" | "ELIGIBLE_FOR_PAYOUT" | "PROCESSING" | "SETTLED" | "WITHHELD";

export interface SellerProfile {
  id: string;
  userId?: string | null;
  slug: string;
  name: string;
  originHub: string;
  story: string;
  heroImage: string;
  verified: boolean;
  rating: number;
  leadTimeDays: number;
  status: SellerStatus;
  businessEmail?: string | null;
  businessPhone?: string | null;
  taxIdentifier?: string | null;
  commissionRatePercent: number;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface SellerMetrics {
  grossSales: number;
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  netProceeds: number;
  commissionDeducted: number;
  totalOrders: number;
  newOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  processingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  refundedOrders: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalEarnings: number;
  pendingEarnings: number;
  eligiblePayout: number;
  settledPayouts: number;
  recentDaysSales?: Array<{ date: string; sales: number; orders: number }>;
  topProducts?: Array<{ id: string; title: string; unitsSold: number; revenue: number }>;
}

export interface SellerProductVariantInput {
  id?: string;
  sku: string;
  variantType: "COLOR" | "SIZE";
  name: string;
  value: string;
  hexCode?: string;
  imageUrl?: string;
  stock: number;
  additionalPrice?: number;
}

export interface SellerProductInput {
  title: string;
  subtitle: string;
  description: string;
  categoryId: string;
  basePrice: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  isPublished?: boolean;
  action?: "DRAFT" | "SUBMIT";
  brand?: string;
  sku?: string;
  productType?: string;
  subcategory?: string;
  searchKeywords?: string;
  dispatchEstimate?: string;
  packageDimensions?: string;
  taxRatePercent?: number;
  material?: string;
  dimensions?: string;
  weight?: string;
  careInstructions?: string;
  images: string[];
  variants?: SellerProductVariantInput[];
  attributes?: Record<string, { value: any; unit?: string | null }>;
  draftKey?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  highlights?: string[];
  mpn?: string;
  gtin?: string;
  countryOfOrigin?: string;
  warranty?: string;
  includedItems?: string;
  returnPolicy?: string;
  googleProductCategory?: string;
  condition?: string;
  targetGender?: string;
  targetAgeGroup?: string;
  imageDetails?: Array<{
    url: string;
    alt?: string;
    title?: string;
    imageType?: string;
    isPrimary?: boolean;
  }>;
}

export interface SellerProductDetailView {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: string;
  categoryName: string;
  vendorId: string;
  basePrice: number;
  compareAtPrice: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  highlights?: string[];
  mpn?: string | null;
  gtin?: string | null;
  countryOfOrigin?: string | null;
  googleProductCategory?: string | null;
  condition?: string | null;
  targetGender?: string | null;
  targetAgeGroup?: string | null;
  stock: number;
  lowStockThreshold: number;
  isPublished: boolean;
  approvalStatus: ProductApprovalStatus;
  moderationNotes: string | null;
  brand: string | null;
  sku: string | null;
  productType: string | null;
  subcategory: string | null;
  searchKeywords: string | null;
  dispatchEstimate: string | null;
  packageDimensions: string | null;
  taxRatePercent: number | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  careInstructions: string | null;
  images: string[];
  variants: {
    id: string;
    sku: string;
    variantType: "COLOR" | "SIZE";
    name: string;
    value: string;
    hexCode?: string | null;
    imageUrl?: string | null;
    stock: number;
    additionalPrice: number;
  }[];
  attributes?: Record<string, { value: any; unit?: string | null }>;
  submittedForReviewAt?: string | null;
  isReviewOverdue?: boolean;
  reviewOverdueAt?: string | null;
  rejectedFields?: string[];
  suggestedCorrections?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProductListItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId: string;
  basePrice: number;
  compareAtPrice?: number | null;
  stock: number;
  lowStockThreshold?: number;
  images: string[];
  variantsCount: number;
  availableColors?: { name: string; hex: string; image?: string }[];
  availableSizes?: string[];
  approvalStatus: ProductApprovalStatus;
  isPublished: boolean;
  moderationNotes: string | null;
  createdAt: string;
}

export type SellerProduct = SellerProductListItem;

export interface SellerOrderLine {
  id: string;
  orderId: string;
  customerName: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryMethodName: string;
  orderedAt: string;
  productId?: string | null;
  productSlug: string;
  title: string;
  sku?: string | null;
  selectedColorName?: string | null;
  selectedSize?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageSnapshot: string;
  fulfillmentStatus: FulfillmentStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  cancellationReason?: string | null;
}

export interface SellerPayoutRecord {
  id: string;
  orderItemId?: string | null;
  productTitle?: string;
  grossAmount: number;
  commission: number;
  netPayout: number;
  status: PayoutStatus;
  settledAt?: string | null;
  transactionRef?: string | null;
  createdAt: string;
}

export interface InventoryBatchUpdateItem {
  productId: string;
  variantSku?: string;
  stockDelta?: number;
  newStock?: number;
}

export interface CsvImportResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: { row: number; sku?: string; error: string }[];
  appliedChanges: { sku: string; previousStock: number; updatedStock: number }[];
}
