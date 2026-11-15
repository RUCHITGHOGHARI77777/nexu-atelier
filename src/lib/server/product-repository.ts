import { Product, Vendor, ProductCategory } from "@/types/marketplace";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { prisma } from "./prisma";

export interface CatalogQueryOptions {
  search?: string;
  category?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featured?: boolean;
  trending?: boolean;
  sortBy?: "price-asc" | "price-desc" | "rating" | "newest" | "popularity" | "featured" | string;
  page?: number;
  limit?: number;
}

export function normalizeSortOption(sortBy?: string): "price-asc" | "price-desc" | "rating" | "newest" | "popularity" | "featured" {
  if (!sortBy) return "newest";
  const s = sortBy.toLowerCase().trim().replace(/_/g, "-");
  if (s === "price-asc" || s === "price-low-to-high" || s === "low-to-high") return "price-asc";
  if (s === "price-desc" || s === "price-high-to-low" || s === "high-to-low") return "price-desc";
  if (s === "rating" || s === "top-rated" || s === "highest-rated") return "rating";
  if (s === "popularity" || s === "best-selling" || s === "bestseller") return "popularity";
  if (s === "featured") return "featured";
  return "newest";
}

export interface CatalogQueryResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function mapDbProductToFrontend(p: any): Product {
  const vendor: Vendor = {
    id: p.vendor.id,
    name: p.vendor.name,
    slug: p.vendor.slug,
    location: p.vendor.originHub,
    tagline: p.vendor.story.slice(0, 80) + "...",
    story: p.vendor.story,
    rating: p.vendor.rating,
    totalSales: 1200,
    verifiedSince: "2022",
    dispatchTime: `Ships in ${p.vendor.leadTimeDays * 24} hours`,
    avatarUrl: p.vendor.heroImage,
    verified: Boolean(p.vendor.verified || p.vendor.status === "APPROVED"),
  };

  const images = (p.images || []).map((img: any) => img.url);
  if (images.length === 0) {
    images.push(
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
    );
  }

  const availableColors = (p.variants || [])
    .filter((v: any) => v.variantType === "COLOR")
    .map((v: any) => ({
      name: v.value,
      hex: v.hexCode || "#000000",
      image: v.imageUrl || images[0],
    }));

  const availableSizes = (p.variants || [])
    .filter((v: any) => v.variantType === "SIZE")
    .map((v: any) => v.value);

  let dynamicSpecs: Array<{ label: string; value: string }> = [];
  if (p.attributesJson) {
    try {
      const parsedAttrs = JSON.parse(p.attributesJson);
      for (const [key, entry] of Object.entries<any>(parsedAttrs)) {
        if (entry && entry.value !== undefined && entry.value !== null && entry.value !== "") {
          const label = key
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          let displayVal = "";
          if (typeof entry.value === "object" && entry.value !== null) {
            displayVal = Object.entries(entry.value)
              .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
              .join(", ");
          } else if (Array.isArray(entry.value)) {
            displayVal = entry.value.join(", ");
          } else if (typeof entry.value === "boolean") {
            displayVal = entry.value ? "Yes" : "No";
          } else {
            displayVal = String(entry.value);
          }
          if (entry.unit) {
            displayVal += ` ${entry.unit}`;
          }
          dynamicSpecs.push({ label, value: displayVal });
        }
      }
    } catch {}
  }

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    category: (p.category?.name || "Modern Essentials") as ProductCategory,
    vendor,
    basePrice: p.basePricePaise / 100,
    compareAtPrice: p.compareAtPricePaise ? p.compareAtPricePaise / 100 : undefined,
    currency: "INR",
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.ratingCount,
    isFeatured: p.isFeatured,
    isTrending: p.isBestseller,
    tags: [p.category?.name || "Artifact", "Handcrafted", "Authentic"],
    images,
    availableColors: availableColors.length > 0 ? availableColors : undefined,
    availableSizes: availableSizes.length > 0 ? availableSizes : undefined,
    variants: (p.variants || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      variantType: v.variantType,
      value: v.value,
      stock: v.stock,
      sku: v.sku,
      hexCode: v.hexCode,
      imageUrl: v.imageUrl,
      priceDeltaPaise: v.priceDeltaPaise ?? v.additionalPricePaise ?? 0,
    })),
    specifications: [
      ...(p.brand ? [{ label: "Brand", value: p.brand }] : []),
      ...(p.material ? [{ label: "Material", value: p.material }] : []),
      ...(p.dimensions ? [{ label: "Dimensions", value: p.dimensions }] : []),
      ...(p.weight ? [{ label: "Weight", value: p.weight }] : []),
      ...(p.careInstructions ? [{ label: "Care Instructions", value: p.careInstructions }] : []),
      ...(p.sku ? [{ label: "SKU", value: p.sku }] : []),
      ...(p.mpn ? [{ label: "Model Number", value: p.mpn }] : []),
      ...(p.gtin ? [{ label: "GTIN", value: p.gtin }] : []),
      ...(p.countryOfOrigin ? [{ label: "Country of Origin", value: p.countryOfOrigin }] : []),
      ...(p.dispatchEstimate ? [{ label: "Dispatch", value: p.dispatchEstimate }] : []),
      ...dynamicSpecs,
    ],
    highlights: (() => {
      if (p.highlightsJson) {
        try {
          const parsed = JSON.parse(p.highlightsJson);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      return [
        `Authentic ${p.brand || 'certified'} piece with verified seller distribution`,
        `Inclusive of all statutory taxes and GST invoice`,
        p.warranty ? p.warranty : `Authorised dealer warranty with verified tracking`,
      ];
    })(),
    materials: p.material || undefined,
    origin: p.countryOfOrigin || p.vendor.originHub || "India",
    estimatedDeliveryDays: p.vendor.leadTimeDays || 3,
    taxRatePercent: p.taxRatePercent !== null && p.taxRatePercent !== undefined ? p.taxRatePercent : 12.0,
    approvalStatus: p.approvalStatus,
    isPublished: p.isPublished !== undefined ? Boolean(p.isPublished) : true,
    brand: p.brand || p.manufacturer || undefined,
    manufacturer: p.manufacturer || p.brand || undefined,
    modelNumber: p.mpn || undefined,
    sku: p.sku || undefined,
    warranty: p.warranty || undefined,
    includedItems: p.includedItems || undefined,
    returnPolicy: p.returnPolicy || undefined,
  };
}

export class PrismaProductRepository {
  public async getProducts(
    options: CatalogQueryOptions = {}
  ): Promise<CatalogQueryResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(300, Math.max(1, options.limit || 24));
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      approvalStatus: { in: ["APPROVED", "PENDING_REVIEW"] },
    };

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (options.category && options.category !== "All") {
      where.category = {
        OR: [
          { slug: { equals: options.category.toLowerCase().replace(/\s+/g, "-") } },
          { name: { equals: options.category, mode: "insensitive" } },
        ],
      };
    }

    if (options.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options.inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (options.featured) {
      where.isFeatured = true;
    }

    if (options.trending) {
      where.isBestseller = true;
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.basePricePaise = {};
      if (options.minPrice !== undefined) {
        where.basePricePaise.gte = Math.round(options.minPrice * 100);
      }
      if (options.maxPrice !== undefined) {
        where.basePricePaise.lte = Math.round(options.maxPrice * 100);
      }
    }

    const normalizedSort = normalizeSortOption(options.sortBy);
    let orderBy: any = { createdAt: "desc" };
    switch (normalizedSort) {
      case "price-asc":
        orderBy = { basePricePaise: "asc" };
        break;
      case "price-desc":
        orderBy = { basePricePaise: "desc" };
        break;
      case "rating":
        orderBy = [{ rating: "desc" }, { ratingCount: "desc" }];
        break;
      case "popularity":
        orderBy = [{ isBestseller: "desc" }, { ratingCount: "desc" }, { rating: "desc" }];
        break;
      case "featured":
        orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [total, dbProducts] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          vendor: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const products = dbProducts.map(mapDbProductToFrontend);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  public async getProductBySlug(slug: string): Promise<Product | null> {
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        vendor: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    if (dbProduct) {
      if (dbProduct.isPublished && (dbProduct.approvalStatus === "APPROVED" || dbProduct.approvalStatus === "PENDING_REVIEW")) {
        return mapDbProductToFrontend(dbProduct);
      }
      return null;
    }

    const seedProduct = SEED_PRODUCTS.find((p) => p.slug === slug);
    if (seedProduct) {
      return seedProduct;
    }

    return null;
  }

  public async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  public async getVendors() {
    return prisma.seller.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }
}

export const productRepository = new PrismaProductRepository();
