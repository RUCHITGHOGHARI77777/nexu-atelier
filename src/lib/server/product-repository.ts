import { Product, Vendor, ProductCategory } from "@/types/marketplace";
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
  sortBy?: "price-asc" | "price-desc" | "rating" | "newest";
  page?: number;
  limit?: number;
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
  };

  const images = (p.images || []).map((img: any) => img.url);
  if (images.length === 0) {
    images.push(
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
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
      priceDeltaPaise: v.priceDeltaPaise,
    })),
    specifications: [
      { label: "Material", value: p.material || "Master-grade natural formulation" },
      { label: "Dimensions", value: p.dimensions || "Custom studio proportion" },
      { label: "Weight", value: p.weight || "Calibrated studio density" },
      { label: "Care", value: p.careInstructions || "Professional care recommended" },
      ...(p.brand ? [{ label: "Brand", value: p.brand }] : []),
      ...(p.sku ? [{ label: "SKU", value: p.sku }] : []),
      ...(p.dispatchEstimate ? [{ label: "Dispatch", value: p.dispatchEstimate }] : []),
    ],
    highlights: [
      "Master artisan craftsmanship with verifiable provenance",
      "Sustainably packaged in recycled, carbon-neutral parceling",
      "Studio authenticity certification included",
    ],
    materials: p.material || "Natural composition",
    origin: p.vendor.originHub || "India",
    estimatedDeliveryDays: p.vendor.leadTimeDays || 3,
  };
}

export class PrismaProductRepository {
  public async getProducts(
    options: CatalogQueryOptions = {}
  ): Promise<CatalogQueryResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 24));
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      approvalStatus: "APPROVED",
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

    let orderBy: any = { createdAt: "desc" };
    switch (options.sortBy) {
      case "price-asc":
        orderBy = { basePricePaise: "asc" };
        break;
      case "price-desc":
        orderBy = { basePricePaise: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "newest":
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

    if (!dbProduct || !dbProduct.isPublished || dbProduct.approvalStatus !== "APPROVED") return null;
    return mapDbProductToFrontend(dbProduct);
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
