import { prisma } from "./prisma";
import { GlobalSeoSettings } from "@/types/seo-discovery";
import { merchantFeedService } from "./merchant-feed-service";

export class GlobalSeoService {
  /**
   * Retrieves all global SEO platform configurations.
   */
  public async getGlobalSeoSettings(): Promise<GlobalSeoSettings> {
    const settings = await prisma.platformSetting.findMany({
      where: { key: { startsWith: "seo." } },
    });

    const map = new Map<string, string>();
    for (const s of settings) {
      map.set(s.key, s.value);
    }

    return {
      siteName: map.get("seo.site_name") || "NEXU ATELIER",
      defaultMetaTitle:
        map.get("seo.default_meta_title") ||
        "NEXU ATELIER — Handcrafted Artisan Heritage & Modern Luxury",
      defaultMetaDescription:
        map.get("seo.default_meta_description") ||
        "Explore certified handcrafted luxury, bespoke artisan textiles, heritage jewellery, and master craft decor on NEXU ATELIER.",
      defaultOgImage:
        map.get("seo.default_og_image") ||
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
      canonicalBaseUrl:
        map.get("seo.canonical_base_url") || "https://nexu.studio",
      googleVerificationCode: map.get("seo.google_verification_code") || "",
      bingVerificationCode: map.get("seo.bing_verification_code") || "",
      merchantCenterAccountId: map.get("seo.merchant_center_account_id") || "",
      targetCountry: map.get("seo.merchant_center_feed_target_country") || "IN",
      feedCurrency: map.get("seo.merchant_center_feed_currency") || "INR",
      outOfStockPolicy:
        (map.get("seo.indexing_policy_out_of_stock") as any) ||
        "INDEX_AS_OUT_OF_STOCK",
    };
  }

  /**
   * Updates global SEO platform configurations and records an audit log.
   */
  public async updateGlobalSeoSettings(
    newSettings: Partial<GlobalSeoSettings>,
    adminId?: string
  ): Promise<GlobalSeoSettings> {
    const keyMap: Record<keyof GlobalSeoSettings, string> = {
      siteName: "seo.site_name",
      defaultMetaTitle: "seo.default_meta_title",
      defaultMetaDescription: "seo.default_meta_description",
      defaultOgImage: "seo.default_og_image",
      canonicalBaseUrl: "seo.canonical_base_url",
      googleVerificationCode: "seo.google_verification_code",
      bingVerificationCode: "seo.bing_verification_code",
      merchantCenterAccountId: "seo.merchant_center_account_id",
      targetCountry: "seo.merchant_center_feed_target_country",
      feedCurrency: "seo.merchant_center_feed_currency",
      outOfStockPolicy: "seo.indexing_policy_out_of_stock",
    };

    for (const [prop, val] of Object.entries(newSettings)) {
      const settingKey = keyMap[prop as keyof GlobalSeoSettings];
      if (settingKey && val !== undefined) {
        await prisma.platformSetting.upsert({
          where: { key: settingKey },
          create: {
            key: settingKey,
            value: String(val),
            description: `Updated via Admin SEO Control Center by ${adminId || "ADMIN"}`,
            updatedBy: adminId || "ADMIN",
          },
          update: {
            value: String(val),
            updatedBy: adminId || "ADMIN",
          },
        });
      }
    }

    if (adminId) {
      await prisma.auditEvent.create({
        data: {
          action: "UPDATE_SEO_SETTINGS",
          performedBy: adminId,
          entityType: "PlatformSetting",
          entityId: "seo",
          note: `Global SEO configuration updated by admin ${adminId}.`,
        },
      });
    }

    return this.getGlobalSeoSettings();
  }

  /**
   * Computes authoritative marketplace-wide SEO metrics directly from PostgreSQL.
   */
  public async getSeoOverviewMetrics() {
    const [
      totalProducts,
      approvedPublished,
      imagesMissingAlt,
      totalImages,
      feedSummary,
      settings,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        where: { isPublished: true, approvalStatus: "APPROVED" },
        select: {
          id: true,
          title: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          seoQualityScore: true,
          stock: true,
          brand: true,
          material: true,
          images: { select: { id: true, alt: true } },
        },
      }),
      prisma.productImage.count({
        where: {
          OR: [{ alt: "" }, { alt: "image" }, { alt: "photo" }],
        },
      }),
      prisma.productImage.count(),
      merchantFeedService.getFeedValidationSummary(),
      this.getGlobalSeoSettings(),
    ]);

    let seoReadyCount = 0;
    let seoWarningCount = 0;
    let seoActionNeededCount = 0;

    for (const p of approvedPublished) {
      const score = p.seoQualityScore || 0;
      if (score >= 80) seoReadyCount++;
      else if (score >= 50) seoWarningCount++;
      else seoActionNeededCount++;
    }

    return {
      totalProducts,
      publishedApprovedCount: approvedPublished.length,
      seoReadyCount,
      seoWarningCount,
      seoActionNeededCount,
      seoReadinessPercent:
        approvedPublished.length > 0
          ? Math.round((seoReadyCount / approvedPublished.length) * 100)
          : 0,
      imageAltCoverage: {
        totalImages,
        missingOrGenericAlt: imagesMissingAlt,
        coveragePercent:
          totalImages > 0
            ? Math.round(((totalImages - imagesMissingAlt) / totalImages) * 100)
            : 100,
      },
      merchantFeed: {
        totalEligible: feedSummary.readyCount + feedSummary.warningCount,
        readyCount: feedSummary.readyCount,
        warningCount: feedSummary.warningCount,
        errorCount: feedSummary.errorCount,
        feedUrl: feedSummary.feedUrl,
        lastGeneratedAt: feedSummary.lastGeneratedAt,
      },
      searchEngineStatus: {
        googleSearchConsole: {
          configured: Boolean(settings.googleVerificationCode),
          verificationCode: settings.googleVerificationCode,
          status: settings.googleVerificationCode
            ? "ACTIVE_VERIFICATION"
            : "UNVERIFIED",
          guidance:
            "Add your GSC verification token above to inject the meta verification tag into all public pages.",
        },
        bingWebmaster: {
          configured: Boolean(settings.bingVerificationCode),
          verificationCode: settings.bingVerificationCode,
          status: settings.bingVerificationCode
            ? "ACTIVE_VERIFICATION"
            : "UNVERIFIED",
          guidance:
            "Add your Bing msvalidate.01 token above to support automated Bing IndexNow and XML discovery.",
        },
        googleMerchantCenter: {
          configured: Boolean(settings.merchantCenterAccountId),
          accountId: settings.merchantCenterAccountId,
          feedUrl: `${settings.canonicalBaseUrl}/api/feeds/google-merchant`,
        },
      },
    };
  }
}

export const globalSeoService = new GlobalSeoService();
