/**
 * NEXU ATELIER — SEO, Amazon-Style Product Details & Product Discovery Types
 */

export type ProductCondition = "NEW" | "REFURBISHED" | "USED";
export type TargetGender = "unisex" | "male" | "female";
export type TargetAgeGroup = "adult" | "all_ages" | "teen" | "kids" | "toddler" | "infant";

export type ImageType =
  | "MAIN"
  | "GALLERY"
  | "FRONT"
  | "BACK"
  | "SIDE"
  | "DETAIL"
  | "IN_USE"
  | "SIZE_CHART"
  | "LIFESTYLE"
  | "VARIANT";

export interface ProductImageExtended {
  id?: string;
  url: string;
  alt: string;
  title?: string;
  imageType: ImageType;
  isPrimary: boolean;
  width?: number;
  height?: number;
  sortOrder?: number;
}

export interface AmazonProductDetails {
  highlights: string[];
  mpn?: string;
  gtin?: string;
  manufacturer?: string;
  countryOfOrigin: string;
  warranty?: string;
  includedItems?: string;
  returnPolicy: string;
  specifications: Array<{ label: string; value: string }>;
}

export interface ProductSeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  seoKeywords?: string;
  googleProductCategory?: string;
  condition: ProductCondition;
  targetGender: TargetGender;
  targetAgeGroup: TargetAgeGroup;
}

export interface SeoQualityIssue {
  code: string;
  field: string;
  severity: "CRITICAL" | "WARNING" | "RECOMMENDATION";
  message: string;
  tip: string;
}

export interface SeoQualityResult {
  score: number; // 0 - 100
  isIndexable: boolean;
  isMerchantEligible: boolean;
  errors: SeoQualityIssue[];
  warnings: SeoQualityIssue[];
  recommendations: SeoQualityIssue[];
  breakdown: {
    titleAndMeta: number; // Max 25
    imageOptimization: number; // Max 20
    productInformation: number; // Max 20
    schemaAndIdentifiers: number; // Max 15
    merchantCenterCompliance: number; // Max 20
  };
  summary: string;
}

export interface MerchantFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_links: string[];
  availability: "in_stock" | "out_of_stock";
  price: string;
  sale_price?: string;
  brand: string;
  gtin?: string;
  mpn?: string;
  condition: string;
  google_product_category?: string;
  product_type?: string;
  shipping: {
    country: string;
    service: string;
    price: string;
  };
  material?: string;
  color?: string;
  size?: string;
  gender: string;
  age_group: string;
}

export interface MerchantFeedValidationItem {
  productId: string;
  productTitle: string;
  slug: string;
  status: "READY" | "WARNING" | "ERROR" | "NOT_ELIGIBLE";
  issues: string[];
}

export interface MerchantFeedStatusSummary {
  totalPublishedProducts: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  ineligibleCount: number;
  lastGeneratedAt: string;
  feedUrl: string;
  items: MerchantFeedValidationItem[];
}

export interface GlobalSeoSettings {
  siteName: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  canonicalBaseUrl: string;
  googleVerificationCode: string;
  bingVerificationCode: string;
  merchantCenterAccountId: string;
  targetCountry: string;
  feedCurrency: string;
  outOfStockPolicy: "INDEX_AS_OUT_OF_STOCK" | "NOINDEX";
}

export interface SeoSuggestionsInput {
  title: string;
  subtitle?: string;
  description?: string;
  categoryName?: string;
  brand?: string;
  material?: string;
  attributes?: Record<string, any>;
  highlights?: string[];
}

export interface SeoSuggestionsResult {
  suggestedTitle: string;
  suggestedMetaDescription: string;
  suggestedKeywords: string;
  suggestedSlug: string;
  suggestedGoogleCategory: string;
  suggestedBulletHighlights: string[];
  rationale: string;
}

export interface SearchFacetItem {
  name: string;
  slug?: string;
  count: number;
}

export interface EnhancedSearchResultFacets {
  categories: SearchFacetItem[];
  brands: SearchFacetItem[];
  priceRange: { min: number; max: number };
  materials: SearchFacetItem[];
  inStockCount: number;
  totalMatches: number;
}
