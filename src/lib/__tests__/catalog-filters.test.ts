import { describe, it, expect } from "vitest";
import { filterCatalog, searchCatalog, sortCatalog } from "../catalog-filters";
import { SEED_PRODUCTS, SEED_VENDORS } from "@/data/seedCatalog";
import { FilterState } from "@/types/marketplace";

describe("searchCatalog", () => {
  it("returns all products when search query is blank", () => {
    const results = searchCatalog(SEED_PRODUCTS, "   ");
    expect(results.length).toBe(SEED_PRODUCTS.length);
  });

  it("finds products by keyword in title or description", () => {
    const results = searchCatalog(SEED_PRODUCTS, "Beryllium");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.title.includes("SoundPulse"))).toBe(true);
  });

  it("finds products by vendor name", () => {
    const results = searchCatalog(SEED_PRODUCTS, "Solstice");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.vendor.name.includes("Solstice"))).toBe(true);
  });
});

describe("filterCatalog", () => {
  const baseFilter: FilterState = {
    searchQuery: "",
    category: "All",
    inStockOnly: false,
    sortBy: "featured",
  };

  it("filters accurately by category", () => {
    const filtered = filterCatalog(SEED_PRODUCTS, {
      ...baseFilter,
      category: "Footwear",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((p) => p.category === "Footwear")).toBe(true);
  });

  it("filters by price range", () => {
    const filtered = filterCatalog(SEED_PRODUCTS, {
      ...baseFilter,
      minPrice: 2000,
      maxPrice: 4000,
    });
    expect(filtered.every((p) => p.basePrice >= 2000 && p.basePrice <= 4000)).toBe(true);
  });

  it("filters only in-stock products", () => {
    const filtered = filterCatalog(SEED_PRODUCTS, {
      ...baseFilter,
      inStockOnly: true,
    });
    expect(filtered.every((p) => p.stock > 0)).toBe(true);
  });
});

describe("sortCatalog", () => {
  it("sorts by price low to high", () => {
    const sorted = sortCatalog(SEED_PRODUCTS, "price-asc");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].basePrice).toBeLessThanOrEqual(sorted[i + 1].basePrice);
    }
  });

  it("sorts by price high to low", () => {
    const sorted = sortCatalog(SEED_PRODUCTS, "price-desc");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].basePrice).toBeGreaterThanOrEqual(sorted[i + 1].basePrice);
    }
  });

  it("sorts by customer rating descending", () => {
    const sorted = sortCatalog(SEED_PRODUCTS, "rating");
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].rating).toBeGreaterThanOrEqual(sorted[i + 1].rating);
    }
  });
});
