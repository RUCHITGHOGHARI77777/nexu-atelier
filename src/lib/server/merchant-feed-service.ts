import { prisma } from "./prisma";
import {
  MerchantFeedItem,
  MerchantFeedStatusSummary,
  MerchantFeedValidationItem,
} from "@/types/seo-discovery";

export class MerchantFeedService {
  /**
   * Retrieves all published products and validates them for Google Merchant Center readiness.
   */
  public async getFeedValidationSummary(): Promise<MerchantFeedStatusSummary> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        approvalStatus: "APPROVED",
      },
      include: {
        vendor: true,
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let readyCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let ineligibleCount = 0;

    const validationItems: MerchantFeedValidationItem[] = [];

    for (const p of products) {
      const issues: string[] = [];
      let status: "READY" | "WARNING" | "ERROR" | "NOT_ELIGIBLE" = "READY";

      if (!p.title || p.title.trim().length < 5) {
        issues.push("Title missing or shorter than 5 characters");
        status = "ERROR";
      }

      if (!p.description || p.description.trim().length < 10) {
        issues.push("Description missing or too short");
        status = "ERROR";
      }

      if (!p.basePricePaise || p.basePricePaise <= 0) {
        issues.push("Price must be greater than zero");
        status = "ERROR";
      }

      if (!p.images || p.images.length === 0) {
        issues.push("Primary product image missing");
        status = "ERROR";
      }

      if (!p.vendor?.name) {
        issues.push("Brand or merchant identity missing");
        status = "ERROR";
      }

      if (status !== "ERROR") {
        if (!p.googleProductCategory) {
          issues.push("Recommended: Google product category taxonomy not mapped");
          if (status === "READY") status = "WARNING";
        }
        if (!p.material) {
          issues.push("Recommended: Material attribute missing");
          if (status === "READY") status = "WARNING";
        }
        if (!p.gtin && !p.mpn) {
          issues.push("Notice: Handcrafted piece without GTIN (will export identifier_exists: 'no')");
        }
      }

      if (status === "READY") readyCount++;
      else if (status === "WARNING") warningCount++;
      else if (status === "ERROR") errorCount++;
      else ineligibleCount++;

      validationItems.push({
        productId: p.id,
        productTitle: p.title,
        slug: p.slug,
        status,
        issues,
      });
    }

    return {
      totalPublishedProducts: products.length,
      readyCount,
      warningCount,
      errorCount,
      ineligibleCount,
      lastGeneratedAt: new Date().toISOString(),
      feedUrl: `${baseUrl}/api/feeds/google-merchant`,
      items: validationItems,
    };
  }

  /**
   * Generates standard RSS 2.0 XML with Google Merchant Center namespace (xmlns:g="http://base.google.com/ns/1.0").
   */
  public async generateGoogleMerchantXml(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

    const countrySetting = await prisma.platformSetting.findUnique({
      where: { key: "seo.merchant_center_feed_target_country" },
    });
    const currencySetting = await prisma.platformSetting.findUnique({
      where: { key: "seo.merchant_center_feed_currency" },
    });
    const siteNameSetting = await prisma.platformSetting.findUnique({
      where: { key: "seo.site_name" },
    });

    const targetCountry = countrySetting?.value || "IN";
    const currency = currencySetting?.value || "INR";
    const siteName = siteNameSetting?.value || "NEXU ATELIER";

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        approvalStatus: "APPROVED",
      },
      include: {
        vendor: true,
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const escapeXml = (unsafe?: string | null): string => {
      if (!unsafe) return "";
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const itemsXml: string[] = [];

    for (const p of products) {
      if (!p.basePricePaise || p.basePricePaise <= 0 || !p.images || p.images.length === 0) {
        continue;
      }

      const productUrl = `${baseUrl}/product/${p.slug}`;
      const primaryImage = p.images[0]?.url || "";
      const additionalImages = p.images.slice(1, 10).map((img) => img.url);

      const priceStr = `${(p.basePricePaise / 100).toFixed(2)} ${currency}`;
      let salePriceXml = "";
      if (p.compareAtPricePaise && p.compareAtPricePaise > p.basePricePaise) {
        const regularPrice = `${(p.compareAtPricePaise / 100).toFixed(2)} ${currency}`;
        salePriceXml = `
      <g:price>${escapeXml(regularPrice)}</g:price>
      <g:sale_price>${escapeXml(priceStr)}</g:sale_price>`;
      } else {
        salePriceXml = `
      <g:price>${escapeXml(priceStr)}</g:price>`;
      }

      const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
      const brand = p.brand || p.vendor.name || siteName;
      const condition = (p.condition || "new").toLowerCase();
      const productType = p.subcategory
        ? `${p.category.name} > ${p.subcategory}`
        : p.category.name;

      const colorVariant = p.variants.find((v) => v.variantType === "COLOR");
      const sizeVariant = p.variants.find((v) => v.variantType === "SIZE");

      const itemLines: string[] = [
        "    <item>",
        `      <g:id>${escapeXml(p.id)}</g:id>`,
        `      <g:title>${escapeXml(p.metaTitle || p.title)}</g:title>`,
        `      <g:description>${escapeXml(p.metaDescription || p.description)}</g:description>`,
        `      <g:link>${escapeXml(productUrl)}</g:link>`,
        `      <g:image_link>${escapeXml(primaryImage)}</g:image_link>`,
      ];

      for (const addUrl of additionalImages) {
        itemLines.push(`      <g:additional_image_link>${escapeXml(addUrl)}</g:additional_image_link>`);
      }

      itemLines.push(`      <g:availability>${availability}</g:availability>`);
      itemLines.push(salePriceXml.trimEnd());
      itemLines.push(`      <g:brand>${escapeXml(brand)}</g:brand>`);
      itemLines.push(`      <g:condition>${escapeXml(condition)}</g:condition>`);

      if (p.gtin) {
        itemLines.push(`      <g:gtin>${escapeXml(p.gtin)}</g:gtin>`);
      }
      if (p.mpn || p.sku) {
        itemLines.push(`      <g:mpn>${escapeXml(p.mpn || p.sku)}</g:mpn>`);
      }
      if (!p.gtin) {
        itemLines.push(`      <g:identifier_exists>no</g:identifier_exists>`);
      }

      if (p.googleProductCategory) {
        itemLines.push(`      <g:google_product_category>${escapeXml(p.googleProductCategory)}</g:google_product_category>`);
      }
      if (productType) {
        itemLines.push(`      <g:product_type>${escapeXml(productType)}</g:product_type>`);
      }
      if (p.material) {
        itemLines.push(`      <g:material>${escapeXml(p.material)}</g:material>`);
      }
      if (colorVariant?.value) {
        itemLines.push(`      <g:color>${escapeXml(colorVariant.value)}</g:color>`);
      }
      if (sizeVariant?.value) {
        itemLines.push(`      <g:size>${escapeXml(sizeVariant.value)}</g:size>`);
      }
      if (p.targetGender) {
        itemLines.push(`      <g:gender>${escapeXml(p.targetGender)}</g:gender>`);
      }
      if (p.targetAgeGroup) {
        itemLines.push(`      <g:age_group>${escapeXml(p.targetAgeGroup)}</g:age_group>`);
      }

      itemLines.push(`      <g:shipping>`);
      itemLines.push(`        <g:country>${escapeXml(targetCountry)}</g:country>`);
      itemLines.push(`        <g:service>Standard Courier</g:service>`);
      itemLines.push(`        <g:price>0.00 ${escapeXml(currency)}</g:price>`);
      itemLines.push(`      </g:shipping>`);

      itemLines.push("    </item>");
      itemsXml.push(itemLines.join("\n"));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(siteName)} Official Product Catalog Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Google Merchant Center Product Feed for ${escapeXml(siteName)} — Certified Artisan Heritage and Handcrafted Luxury</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml.join("\n")}
  </channel>
</rss>`;

    return xml;
  }
}

export const merchantFeedService = new MerchantFeedService();
