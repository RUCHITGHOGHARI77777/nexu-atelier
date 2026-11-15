import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { seoQualityService } from "../seo-quality-service";
import { merchantFeedService } from "../merchant-feed-service";
import { sitemapService } from "../sitemap-service";
import { slugRedirectService } from "../slug-redirect-service";
import { internalSearchService } from "../internal-search-service";
import { globalSeoService } from "../global-seo-service";

describe("NEXU ATELIER — Multi-Channel SEO & Product Discovery Engine", () => {
  let testProductId: string;
  let testOldSlug: string;
  let testNewSlug: string;

  beforeAll(async () => {
    const approvedProduct = await prisma.product.findFirst({
      where: { isPublished: true, approvalStatus: "APPROVED" },
      include: { vendor: true, category: true, images: true },
    });

    if (approvedProduct) {
      testProductId = approvedProduct.id;
      testOldSlug = approvedProduct.slug;
      testNewSlug = `${approvedProduct.slug}-seo-revised`;
    }
  });

  afterAll(async () => {
    if (testOldSlug) {
      await prisma.productSlugRedirect.deleteMany({
        where: {
          OR: [{ oldSlug: testOldSlug }, { newSlug: testNewSlug }],
        },
      });
    }
  });

  describe("1. SEO Quality Scoring & Recommendation Engine", () => {
    it("flags missing titles, spam terms, and insufficient descriptions", () => {
      const evaluation = seoQualityService.evaluateProductSeo({
        title: "CHEAP FREE SILK SAREE BUY NOW",
        description: "Short",
        slug: "invalid_slug_with_underscores!",
        images: [],
      });

      expect(evaluation.score).toBeLessThan(40);
      expect(evaluation.isIndexable).toBe(false);
      expect(evaluation.errors.some((e) => e.code === "SPAM_TERM_IN_TITLE")).toBe(true);
      expect(evaluation.errors.some((e) => e.code === "NO_IMAGES")).toBe(true);
      expect(evaluation.errors.some((e) => e.code === "SLUG_INVALID_CHARS")).toBe(true);
      expect(evaluation.warnings.some((w) => w.code === "META_DESC_TOO_SHORT")).toBe(true);
    });

    it("awards high score (>=80) for complete, optimized marketplace pieces", () => {
      const evaluation = seoQualityService.evaluateProductSeo({
        title: "Handcrafted Royal Brass Urli with Floral Carving",
        metaTitle: "Royal Brass Urli with Hand-Carved Floral Inlay | Nexu Atelier",
        metaDescription:
          "Discover the royal brass urli bowl handcrafted by master bell-metal artisans. Certified authentic heritage metalcraft with archival studio delivery.",
        slug: "royal-brass-urli-floral-carving",
        brand: "Studio Pital",
        sku: "NX-URLI-01",
        mpn: "URLI-BRASS-500",
        material: "Pure Virgin Brass",
        dimensions: "35cm Diameter × 12cm Height",
        weight: "2.4 kg",
        highlights: [
          "Authentic virgin brass alloy with hand-engraved motifs",
          "Accompanied by studio authenticity archive credentials",
          "Dispatched in carbon-neutral protective packaging",
        ],
        basePrice: 6500,
        stock: 12,
        googleProductCategory: "Home & Garden > Decor",
        condition: "NEW",
        images: [
          {
            url: "https://images.unsplash.com/photo-1",
            alt: "Front view of royal brass urli with traditional floral carvings",
            imageType: "MAIN",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-2",
            alt: "Close-up detail of hand-engraved brass rim and petal motifs",
            imageType: "DETAIL",
          },
          {
            url: "https://images.unsplash.com/photo-3",
            alt: "Royal brass urli styled as floating flower bowl in courtyard",
            imageType: "LIFESTYLE",
          },
        ],
      });

      expect(evaluation.score).toBeGreaterThanOrEqual(80);
      expect(evaluation.isIndexable).toBe(true);
      expect(evaluation.isMerchantEligible).toBe(true);
      expect(evaluation.errors).toHaveLength(0);
      expect(evaluation.breakdown.titleAndMeta).toBeGreaterThanOrEqual(20);
      expect(evaluation.breakdown.imageOptimization).toBe(20);
    });

    it("generates natural, non-spammy SEO suggestions from catalog attributes", () => {
      const suggestions = seoQualityService.generateSuggestions({
        title: "Kashmiri Pashmina Shawl",
        description:
          "Fine grade authentic hand-spun Himalayan cashmere wool stole woven on traditional handlooms in Srinagar.",
        brand: "Zooni Weaves",
        categoryName: "Apparel & Accessories",
        material: "100% Cashmere Wool",
        highlights: ["Hand-spun fine fiber count"],
      });

      expect(suggestions.suggestedTitle).toContain("Kashmiri Pashmina Shawl");
      expect(suggestions.suggestedTitle).toContain("Nexu Atelier");
      expect(suggestions.suggestedSlug).toBe("kashmiri-pashmina-shawl");
      expect(suggestions.suggestedMetaDescription.length).toBeGreaterThan(60);
      expect(suggestions.suggestedMetaDescription.length).toBeLessThanOrEqual(160);
      expect(suggestions.suggestedBulletHighlights.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("2. Google Merchant Center Feed Architecture", () => {
    it("generates valid RSS 2.0 XML with Google Merchant namespace", async () => {
      const xml = await merchantFeedService.generateGoogleMerchantXml();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
      expect(xml).toContain("<channel>");
      expect(xml).toContain("</channel>");
      expect(xml).toContain("</rss>");

      expect(xml).toContain("<g:id>");
      expect(xml).toContain("<g:title>");
      expect(xml).toContain("<g:price>");
      expect(xml).toContain("<g:availability>");
      expect(xml).toContain("<g:link>");
      expect(xml).toContain("<g:image_link>");
      expect(xml).toContain("<g:shipping>");
    });

    it("summarizes feed validation statistics accurately across database products", async () => {
      const summary = await merchantFeedService.getFeedValidationSummary();

      expect(summary.totalPublishedProducts).toBeGreaterThan(0);
      expect(summary.readyCount + summary.warningCount).toBeGreaterThan(0);
      expect(summary.feedUrl).toContain("/api/feeds/google-merchant");
      expect(summary.items.length).toBe(summary.totalPublishedProducts);
    });
  });

  describe("3. Partitioned Dynamic XML Sitemaps & Robots Guidance", () => {
    it("generates a valid XML Sitemap Index", async () => {
      const xml = await sitemapService.generateSitemapIndexXml();

      expect(xml).toContain("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
      expect(xml).toContain("/sitemaps/products.xml</loc>");
      expect(xml).toContain("/sitemaps/categories.xml</loc>");
      expect(xml).toContain("/sitemaps/pages.xml</loc>");
      expect(xml).toContain("/sitemaps/images.xml</loc>");
    });

    it("generates Products Sitemap with approved database products and strict changefreq", async () => {
      const xml = await sitemapService.generateProductsSitemapXml();

      expect(xml).toContain("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
      expect(xml).toContain("<priority>0.9</priority>");
      expect(xml).toContain("<changefreq>daily</changefreq>");
      expect(xml).toContain("/product/");
    });

    it("generates Google Image Sitemap containing indexed photography", async () => {
      const xml = await sitemapService.generateImageSitemapXml();

      expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
      expect(xml).toContain("<image:image>");
      expect(xml).toContain("<image:loc>");
    });
  });

  describe("4. 301 Slug Redirect Engine", () => {
    it("records a slug change and resolves target accurately", async () => {
      if (!testProductId) return;

      const oldSlug = `test-old-slug-${Date.now()}`;
      const newSlug = `test-new-slug-${Date.now()}`;

      await slugRedirectService.recordSlugChange(testProductId, oldSlug, newSlug);

      const target = await slugRedirectService.getRedirectForSlug(oldSlug);
      expect(target).toBe(newSlug);

      await prisma.productSlugRedirect.deleteMany({
        where: { oldSlug },
      });
    });

    it("resolves chained slug redirects (slug-a -> slug-b -> slug-c)", async () => {
      if (!testProductId) return;

      const slugA = `chain-a-${Date.now()}`;
      const slugB = `chain-b-${Date.now()}`;
      const slugC = `chain-c-${Date.now()}`;

      await slugRedirectService.recordSlugChange(testProductId, slugA, slugB);
      await slugRedirectService.recordSlugChange(testProductId, slugB, slugC);

      const resolvedA = await slugRedirectService.getRedirectForSlug(slugA);
      const resolvedB = await slugRedirectService.getRedirectForSlug(slugB);

      expect(resolvedA).toBe(slugC);
      expect(resolvedB).toBe(slugC);

      await prisma.productSlugRedirect.deleteMany({
        where: { OR: [{ oldSlug: slugA }, { oldSlug: slugB }] },
      });
    });
  });

  describe("5. Internal Search Engine with Synonyms & Facets", () => {
    it("expands craft synonyms (e.g. 'sari' to 'saree', 'pital' to 'brass')", () => {
      const { expandedTokens } = internalSearchService.expandQueryTokens("banarasi sari");
      expect(expandedTokens).toContain("sari");
      expect(expandedTokens).toContain("saree");

      const pitalExpansion = internalSearchService.expandQueryTokens("pital urli");
      expect(pitalExpansion.expandedTokens).toContain("brass");
      expect(pitalExpansion.expandedTokens).toContain("bronze");
    });

    it("searches database products and computes dynamic multi-attribute facets", async () => {
      const result = await internalSearchService.searchProducts({
        q: "Silk",
        page: 1,
        limit: 10,
      });

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.facets.categories.length).toBeGreaterThan(0);
      expect(result.facets.brands.length).toBeGreaterThan(0);
      expect(result.facets.priceRange.max).toBeGreaterThan(0);
      expect(result.facets.inStockCount).toBeGreaterThanOrEqual(0);
    });

    it("provides fast autocomplete suggestions", async () => {
      const suggestions = await internalSearchService.getInstantSuggestions("Silk", 4);
      expect(Array.isArray(suggestions)).toBe(true);
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty("slug");
        expect(suggestions[0]).toHaveProperty("basePrice");
      }
    });
  });

  describe("6. Admin Global SEO Controls & Health Metrics", () => {
    it("reads and updates platform SEO settings with audit event tracking", async () => {
      const settings = await globalSeoService.getGlobalSeoSettings();
      expect(settings.siteName).toBe("NEXU ATELIER");
      expect(settings.canonicalBaseUrl).toContain("https://");

      const updated = await globalSeoService.updateGlobalSeoSettings(
        { siteName: "NEXU ATELIER" },
        "test-admin-id"
      );
      expect(updated.siteName).toBe("NEXU ATELIER");

      const audit = await prisma.auditEvent.findFirst({
        where: { action: "UPDATE_SEO_SETTINGS" },
        orderBy: { createdAt: "desc" },
      });
      expect(audit).not.toBeNull();
      expect(audit?.entityType).toBe("PlatformSetting");
    });

    it("computes database-backed SEO health overview metrics", async () => {
      const overview = await globalSeoService.getSeoOverviewMetrics();

      expect(overview.totalProducts).toBeGreaterThan(0);
      expect(overview.publishedApprovedCount).toBeGreaterThan(0);
      expect(overview.imageAltCoverage).toBeDefined();
      expect(overview.imageAltCoverage.totalImages).toBeGreaterThan(0);
      expect(overview.merchantFeed).toBeDefined();
      expect(overview.searchEngineStatus.googleSearchConsole).toBeDefined();
      expect(overview.searchEngineStatus.bingWebmaster).toBeDefined();
    });
  });
});
