import { describe, it, expect } from "vitest";
import { productRepository } from "../product-repository";

describe("productRepository - Database Catalog Reads & Discovery", () => {
  it("fetches published products from database with default pagination", async () => {
    const res = await productRepository.getProducts({ page: 1, limit: 10 });
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.total).toBeGreaterThanOrEqual(12);
    expect(res.page).toBe(1);
    expect(res.totalPages).toBeGreaterThanOrEqual(2);

    const first = res.products[0];
    expect(first.id).toBeDefined();
    expect(first.title).toBeDefined();
    expect(first.basePrice).toBeGreaterThan(0);
    expect(first.vendor).toBeDefined();
    expect(first.images.length).toBeGreaterThan(0);
  });

  it("filters products by search keyword across title and description", async () => {
    const res = await productRepository.getProducts({ search: "Chanderi" });
    expect(res.products.length).toBeGreaterThanOrEqual(1);
    expect(
      res.products.some((p) => p.title.toLowerCase().includes("chanderi"))
    ).toBe(true);
  });

  it("filters products by category slug/name", async () => {
    const res = await productRepository.getProducts({ category: "Apparel" });
    expect(res.products.length).toBeGreaterThanOrEqual(1);
    expect(res.products.every((p) => p.category === "Apparel")).toBe(true);
  });

  it("filters products by price boundaries", async () => {
    const minPrice = 3000;
    const maxPrice = 8000;
    const res = await productRepository.getProducts({ minPrice, maxPrice });
    expect(res.products.length).toBeGreaterThan(0);
    expect(
      res.products.every((p) => p.basePrice >= minPrice && p.basePrice <= maxPrice)
    ).toBe(true);
  });

  it("sorts products deterministically by price ascending", async () => {
    const res = await productRepository.getProducts({ sortBy: "price-asc", limit: 5 });
    expect(res.products.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < res.products.length - 1; i++) {
      expect(res.products[i].basePrice).toBeLessThanOrEqual(res.products[i + 1].basePrice);
    }
  });

  it("fetches a single product by slug with complete variants and images", async () => {
    const slug = "chanderi-silk-embroidered-anarkali-robe";
    const product = await productRepository.getProductBySlug(slug);

    expect(product).not.toBeNull();
    expect(product?.slug).toBe(slug);
    expect(product?.vendor.name).toBe("Solstice Loom Studio");
    expect(product?.images.length).toBeGreaterThan(0);
    expect(product?.availableColors?.length).toBeGreaterThan(0);
    expect(product?.availableSizes?.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent slug", async () => {
    const product = await productRepository.getProductBySlug("completely-non-existent-product-slug");
    expect(product).toBeNull();
  });
});
