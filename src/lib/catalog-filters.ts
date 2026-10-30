import { FilterState, Product, SortOption } from "@/types/marketplace";

/**
 * Searches the catalog against title, subtitle, description, tags, and vendor name.
 */
export function searchCatalog(products: Product[], query: string = ""): Product[] {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return products;

  return products.filter((p) => {
    return (
      p.title.toLowerCase().includes(clean) ||
      p.subtitle.toLowerCase().includes(clean) ||
      p.description.toLowerCase().includes(clean) ||
      p.category.toLowerCase().includes(clean) ||
      p.vendor.name.toLowerCase().includes(clean) ||
      p.vendor.location.toLowerCase().includes(clean) ||
      p.tags.some((tag) => tag.toLowerCase().includes(clean))
    );
  });
}

/**
 * Filters the catalog by category, price boundaries, stock availability, and vendor ID.
 */
export function filterCatalog(products: Product[], filters: FilterState): Product[] {
  let result = searchCatalog(products, filters.searchQuery);

  if (filters.category !== "All") {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    result = result.filter((p) => p.basePrice >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    result = result.filter((p) => p.basePrice <= filters.maxPrice!);
  }

  if (filters.inStockOnly) {
    result = result.filter((p) => p.stock > 0);
  }

  if (filters.vendorId) {
    result = result.filter((p) => p.vendor.id === filters.vendorId);
  }

  return sortCatalog(result, filters.sortBy);
}

/**
 * Deterministically sorts the catalog according to the selected option.
 */
export function sortCatalog(products: Product[], sortBy: SortOption): Product[] {
  const list = [...products];

  switch (sortBy) {
    case "price-asc":
      return list.sort((a, b) => a.basePrice - b.basePrice);
    case "price-desc":
      return list.sort((a, b) => b.basePrice - a.basePrice);
    case "rating":
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "newest":
      return list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    case "featured":
    default:
      return list.sort((a, b) => {
        const scoreA = (a.isFeatured ? 2 : 0) + (a.isTrending ? 1 : 0);
        const scoreB = (b.isFeatured ? 2 : 0) + (b.isTrending ? 1 : 0);
        return scoreB - scoreA;
      });
  }
}
