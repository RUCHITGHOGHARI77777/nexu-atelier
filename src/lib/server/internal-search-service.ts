import { prisma } from "./prisma";
import { mapDbProductToFrontend } from "./product-repository";
import { Product } from "@/types/marketplace";
import { EnhancedSearchResultFacets, SearchFacetItem } from "@/types/seo-discovery";

const SYNONYM_DICTIONARY: Record<string, string[]> = {
  saree: ["sari", "shari", "drape", "handloom"],
  sari: ["saree", "shari", "drape", "handloom"],
  pashmina: ["cashmere", "shawl", "stole", "wrap", "wool"],
  shawl: ["pashmina", "stole", "wrap", "chaddar"],
  kurta: ["kurti", "tunic", "angrakha"],
  jewelry: ["jewellery", "ornaments", "kundan", "polki", "silver", "gold"],
  jewellery: ["jewelry", "ornaments", "kundan", "polki", "silver", "gold"],
  brass: ["bronze", "pital", "copper", "metal", "bell metal"],
  wood: ["teak", "sheesham", "rosewood", "timber", "carved"],
  silk: ["mulberry", "tussar", "chanderi", "banarasi", "eri", "muga"],
  cotton: ["mulmul", "khadi", "muslin", "handspun"],
  ceramic: ["pottery", "clay", "terracotta", "blue pottery", "stoneware"],
  urli: ["bowl", "vessel", "floating urli", "brass bowl"],
  lamp: ["diya", "deepak", "lantern", "candelabra"],
};

export interface SearchOptions {
  q?: string;
  category?: string;
  brand?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: "featured" | "price-asc" | "price-desc" | "rating" | "newest" | "popularity" | string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: EnhancedSearchResultFacets;
  appliedQuery: string;
  expandedSynonyms: string[];
  suggestedAlternatives?: string[];
}

export class InternalSearchService {
  /**
   * Expands a user query with relevant marketplace synonyms and typo-tolerant variations.
   */
  public expandQueryTokens(query: string): { originalTerms: string[]; expandedTokens: string[] } {
    const clean = query.trim().toLowerCase();
    if (!clean) return { originalTerms: [], expandedTokens: [] };

    const terms = clean.split(/\s+/).filter(Boolean);
    const tokenSet = new Set<string>(terms);

    for (const term of terms) {
      for (const [key, syns] of Object.entries(SYNONYM_DICTIONARY)) {
        if (term === key || syns.includes(term) || term.includes(key) || key.includes(term)) {
          tokenSet.add(key);
          for (const s of syns) tokenSet.add(s);
        }
      }
    }

    return {
      originalTerms: terms,
      expandedTokens: Array.from(tokenSet),
    };
  }

  /**
   * Performs an integrated multi-attribute search across approved database products.
   */
  public async searchProducts(options: SearchOptions = {}): Promise<SearchResponse> {
    const rawQuery = (options.q || "").trim();
    const { originalTerms, expandedTokens } = this.expandQueryTokens(rawQuery);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 24));
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      isPublished: true,
      approvalStatus: "APPROVED",
    };

    if (options.inStockOnly) {
      baseWhere.stock = { gt: 0 };
    }

    if (options.minPrice !== undefined && options.minPrice > 0) {
      baseWhere.basePricePaise = {
        ...(baseWhere.basePricePaise || {}),
        gte: Math.round(options.minPrice * 100),
      };
    }

    if (options.maxPrice !== undefined && options.maxPrice > 0) {
      baseWhere.basePricePaise = {
        ...(baseWhere.basePricePaise || {}),
        lte: Math.round(options.maxPrice * 100),
      };
    }

    if (options.category && options.category !== "All") {
      baseWhere.category = {
        OR: [
          { name: { equals: options.category, mode: "insensitive" } },
          { slug: { equals: options.category.toLowerCase().replace(/\s+/g, "-") } },
        ],
      };
    }

    if (options.brand) {
      baseWhere.OR = [
        { brand: { equals: options.brand, mode: "insensitive" } },
        { vendor: { name: { equals: options.brand, mode: "insensitive" } } },
      ];
    }

    if (options.material) {
      baseWhere.material = { contains: options.material, mode: "insensitive" };
    }

    if (expandedTokens.length > 0) {
      const searchConditions: any[] = [];
      for (const token of expandedTokens) {
        searchConditions.push(
          { title: { contains: token, mode: "insensitive" } },
          { subtitle: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } },
          { brand: { contains: token, mode: "insensitive" } },
          { sku: { contains: token, mode: "insensitive" } },
          { material: { contains: token, mode: "insensitive" } },
          { searchKeywords: { contains: token, mode: "insensitive" } },
          { subcategory: { contains: token, mode: "insensitive" } }
        );
      }
      baseWhere.AND = [
        ...(baseWhere.AND || []),
        { OR: searchConditions },
      ];
    }

    const rawSort = (options.sortBy || "featured").toLowerCase().trim().replace(/_/g, "-");
    let orderBy: any = [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }];
    
    if (rawSort === "price-asc" || rawSort === "price-low-to-high" || rawSort === "low-to-high") {
      orderBy = { basePricePaise: "asc" };
    } else if (rawSort === "price-desc" || rawSort === "price-high-to-low" || rawSort === "high-to-low") {
      orderBy = { basePricePaise: "desc" };
    } else if (rawSort === "rating" || rawSort === "top-rated" || rawSort === "highest-rated") {
      orderBy = [{ rating: "desc" }, { ratingCount: "desc" }];
    } else if (rawSort === "popularity" || rawSort === "best-selling" || rawSort === "bestseller") {
      orderBy = [{ isBestseller: "desc" }, { ratingCount: "desc" }, { rating: "desc" }];
    } else if (rawSort === "newest" || rawSort === "latest") {
      orderBy = { createdAt: "desc" };
    } else if (rawSort === "featured") {
      orderBy = [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }];
    }

    const [total, dbItems, allApprovedForFacets] = await Promise.all([
      prisma.product.count({ where: baseWhere }),
      prisma.product.findMany({
        where: baseWhere,
        include: {
          vendor: true,
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.findMany({
        where: { isPublished: true, approvalStatus: "APPROVED" },
        select: {
          brand: true,
          material: true,
          stock: true,
          basePricePaise: true,
          category: { select: { name: true, slug: true } },
          vendor: { select: { name: true } },
        },
      }),
    ]);

    const categoryCountMap = new Map<string, { count: number; slug: string }>();
    const brandCountMap = new Map<string, number>();
    const materialCountMap = new Map<string, number>();
    let minPriceFound = Infinity;
    let maxPriceFound = 0;
    let totalInStock = 0;

    for (const item of allApprovedForFacets) {
      const catName = item.category?.name || "Uncategorized";
      const catSlug = item.category?.slug || "uncategorized";
      const existingCat = categoryCountMap.get(catName) || { count: 0, slug: catSlug };
      existingCat.count++;
      categoryCountMap.set(catName, existingCat);

      const brandName = item.brand || item.vendor?.name;
      if (brandName) {
        brandCountMap.set(brandName, (brandCountMap.get(brandName) || 0) + 1);
      }

      if (item.material) {
        materialCountMap.set(item.material, (materialCountMap.get(item.material) || 0) + 1);
      }

      const price = item.basePricePaise / 100;
      if (price < minPriceFound) minPriceFound = price;
      if (price > maxPriceFound) maxPriceFound = price;

      if (item.stock > 0) totalInStock++;
    }

    const categoriesFacet: SearchFacetItem[] = Array.from(categoryCountMap.entries()).map(
      ([name, val]) => ({ name, count: val.count, slug: val.slug })
    );
    const brandsFacet: SearchFacetItem[] = Array.from(brandCountMap.entries()).map(
      ([name, count]) => ({ name, count })
    );
    const materialsFacet: SearchFacetItem[] = Array.from(materialCountMap.entries()).map(
      ([name, count]) => ({ name, count })
    );

    const facets: EnhancedSearchResultFacets = {
      categories: categoriesFacet,
      brands: brandsFacet,
      priceRange: {
        min: minPriceFound === Infinity ? 0 : minPriceFound,
        max: maxPriceFound,
      },
      materials: materialsFacet,
      inStockCount: totalInStock,
      totalMatches: total,
    };

    const products = dbItems.map(mapDbProductToFrontend);

    let suggestedAlternatives: string[] = [];
    if (total === 0 && rawQuery) {
      suggestedAlternatives = [
        "Handcrafted Silk",
        "Pashmina Shawl",
        "Heritage Brass Urli",
        "Kundan Jewelry",
        "Handloom Saree",
      ];
    }

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      facets,
      appliedQuery: rawQuery,
      expandedSynonyms: expandedTokens.filter((t) => !originalTerms.includes(t)),
      suggestedAlternatives: suggestedAlternatives.length > 0 ? suggestedAlternatives : undefined,
    };
  }

  /**
   * Provides fast instant autocomplete suggestions for search inputs.
   */
  public async getInstantSuggestions(query: string, limit: number = 6): Promise<any[]> {
    const clean = (query || "").trim();
    if (!clean) return [];

    const { expandedTokens } = this.expandQueryTokens(clean);

    const orConditions: any[] = [];
    for (const token of expandedTokens) {
      orConditions.push(
        { title: { contains: token, mode: "insensitive" } },
        { brand: { contains: token, mode: "insensitive" } },
        { category: { name: { contains: token, mode: "insensitive" } } }
      );
    }

    const items = await prisma.product.findMany({
      where: {
        isPublished: true,
        approvalStatus: "APPROVED",
        OR: orConditions,
      },
      include: {
        vendor: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      take: limit,
      orderBy: { rating: "desc" },
    });

    return items.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category.name,
      brand: p.brand || p.vendor.name,
      basePrice: p.basePricePaise / 100,
      image: p.images[0]?.url || "",
      stock: p.stock,
    }));
  }
}

export const internalSearchService = new InternalSearchService();
