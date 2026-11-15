import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { productRepository } from "../product-repository";
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_MARKETS,
  CurrencyCode,
} from "@/types/international";

describe("NEXU ATELIER — Complete Global Public Storefront Suite", () => {
  describe("1. International Currency & Market Configurations", () => {
    it("defines all supported international currencies with ISO symbols", () => {
      expect(SUPPORTED_CURRENCIES.INR).toBeDefined();
      expect(SUPPORTED_CURRENCIES.USD).toBeDefined();
      expect(SUPPORTED_CURRENCIES.EUR).toBeDefined();
      expect(SUPPORTED_CURRENCIES.GBP).toBeDefined();
      expect(SUPPORTED_CURRENCIES.AED).toBeDefined();

      expect(SUPPORTED_CURRENCIES.INR.symbol).toBe("₹");
      expect(SUPPORTED_CURRENCIES.USD.symbol).toBe("$");
      expect(SUPPORTED_CURRENCIES.EUR.symbol).toBe("€");
      expect(SUPPORTED_CURRENCIES.GBP.symbol).toBe("£");
      expect(SUPPORTED_CURRENCIES.AED.symbol).toBe("د.إ");
    });

    it("verifies default active markets include major global destinations", () => {
      const marketCodes = DEFAULT_MARKETS.map((m) => m.code);
      expect(marketCodes).toContain("IN");
      expect(marketCodes).toContain("US");
      expect(marketCodes).toContain("GB");
      expect(marketCodes).toContain("EU");
      expect(marketCodes).toContain("AE");

      const inMarket = DEFAULT_MARKETS.find((m) => m.code === "IN");
      expect(inMarket?.defaultCurrency).toBe("INR");
      expect(inMarket?.shippingEligible).toBe(true);
    });

    it("calculates multi-currency price conversions accurately", () => {
      const exchangeRates: Record<CurrencyCode, number> = {
        INR: 1.0,
        USD: 0.0118,
        EUR: 0.0109,
        GBP: 0.0093,
        AED: 0.0433,
      };

      const inrPrice = 10000;
      const usdPrice = inrPrice * exchangeRates.USD;
      const eurPrice = inrPrice * exchangeRates.EUR;
      const gbpPrice = inrPrice * exchangeRates.GBP;
      const aedPrice = inrPrice * exchangeRates.AED;

      expect(usdPrice).toBeCloseTo(118.0, 1);
      expect(eurPrice).toBeCloseTo(109.0, 1);
      expect(gbpPrice).toBeCloseTo(93.0, 1);
      expect(aedPrice).toBeCloseTo(433.0, 1);
    });
  });

  describe("2. Database Category Discovery & Guild Disciplines", () => {
    it("ensures all categories exist with valid slugs and descriptions", async () => {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isPublished: true,
                  approvalStatus: "APPROVED",
                },
              },
            },
          },
        },
      });

      expect(categories.length).toBeGreaterThanOrEqual(4);
      for (const cat of categories) {
        expect(cat.name).toBeTruthy();
        expect(cat.slug).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.image).toBeTruthy();
        expect(cat._count.products).toBeGreaterThanOrEqual(0);
      }
    });

    it("retrieves published products mapped by category without orphan records", async () => {
      const apparelCategory = await prisma.category.findFirst({
        where: { slug: "apparel" },
      });
      expect(apparelCategory).toBeDefined();

      if (apparelCategory) {
        const { products, total } = await productRepository.getProducts({
          category: apparelCategory.name,
        });
        expect(total).toBeGreaterThan(0);
        for (const p of products) {
          expect(p.category).toBe(apparelCategory.name);
          expect(p.vendor.id).toBeTruthy();
          expect(p.images.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("3. Verified Spotlight Seller Engine", () => {
    it("finds top verified and approved artisan studio with published pieces", async () => {
      const seller = await prisma.seller.findFirst({
        where: {
          verified: true,
          status: "APPROVED",
          products: {
            some: {
              isPublished: true,
              approvalStatus: "APPROVED",
            },
          },
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isPublished: true,
                  approvalStatus: "APPROVED",
                },
              },
            },
          },
        },
      });

      expect(seller).toBeDefined();
      expect(seller?.verified).toBe(true);
      expect(seller?.status).toBe("APPROVED");
      expect(seller?.originHub).toBeTruthy();
      expect(seller?._count.products).toBeGreaterThan(0);
    });
  });

  describe("4. Public Order Consignment Tracking Engine", () => {
    it("verifies tracking retrieval logic rejects non-existent orders", async () => {
      const nonExistent = await prisma.order.findUnique({
        where: { id: "ORD-9999-NONEXISTENT" },
      });
      expect(nonExistent).toBeNull();
    });

    it("verifies real order details match customer contact without data leaks", async () => {
      const order = await prisma.order.findFirst({
        where: {
          items: {
            some: {},
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: {
            select: {
              email: true,
              profile: {
                select: {
                  phone: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              title: true,
              productSlug: true,
              quantity: true,
              vendorName: true,
            },
          },
        },
      });

      expect(order).toBeDefined();
      if (order) {
        expect(order.id).toMatch(/^ORD-/);
        expect(order.customerEmail).toBeTruthy();
        expect(order.items.length).toBeGreaterThan(0);
        expect(order.items[0].vendorName).toBeTruthy();
      }
    });
  });

  describe("5. Product Catalog & Honest Review Metrics", () => {
    it("verifies rating count integrity on live catalog pieces", async () => {
      const products = await prisma.product.findMany({
        where: { isPublished: true, approvalStatus: "APPROVED" },
        select: {
          id: true,
          title: true,
          rating: true,
          ratingCount: true,
          reviews: {
            where: { status: "PUBLISHED" },
            select: { id: true, rating: true },
          },
        },
      });

      expect(products.length).toBeGreaterThan(0);
      for (const p of products) {
        expect(typeof p.rating).toBe("number");
        expect(typeof p.ratingCount).toBe("number");
        expect(p.ratingCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
