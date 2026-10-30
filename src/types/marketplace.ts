export type ProductCategory =
  | "Apparel"
  | "Audio & Tech"
  | "Footwear"
  | "Objects & Living"
  | "Accessories";

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  location: string;
  tagline: string;
  story: string;
  rating: number;
  totalSales: number;
  verifiedSince: string;
  dispatchTime: string;
  avatarUrl: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  image?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  variantType?: string;
  value?: string;
  color?: ColorVariant;
  size?: string;
  sku: string;
  stock: number;
  hexCode?: string;
  imageUrl?: string;
  priceDeltaPaise?: number;
  priceModifier?: number; // difference from basePrice if any
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: ProductCategory;
  vendor: Vendor;
  basePrice: number;
  compareAtPrice?: number; // only set if genuinely discounted
  currency: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  tags: string[];
  availableColors?: ColorVariant[];
  availableSizes?: string[];
  variants?: ProductVariant[];
  specifications: ProductSpecification[];
  highlights: string[];
  materials?: string;
  origin?: string;
  estimatedDeliveryDays: number;
}

export interface CartItem {
  id: string; // generated unique key: productId + variantId/selection
  productId: string;
  product: Product;
  selectedColor?: ColorVariant;
  selectedSize?: string;
  selectedSku?: string;
  variantId?: string;
  selectedVariant?: any;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  savingsTotal: number;
  estimatedTax: number;
  shippingFee: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  total: number;
}

export interface VendorCartGroup {
  vendor: Vendor;
  items: CartItem[];
  subtotal: number;
}

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest";

export interface FilterState {
  searchQuery: string;
  category: ProductCategory | "All";
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  vendorId?: string;
  sortBy: SortOption;
}
