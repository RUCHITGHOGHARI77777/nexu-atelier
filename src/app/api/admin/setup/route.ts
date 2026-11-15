import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { prisma } from "@/lib/server/prisma";
import { securityAuditLedgerService } from "@/lib/server/security-audit-ledger-service";

export const dynamic = "force-dynamic";

export interface MarketplaceSetupConfig {
  marketplaceName: string;
  websiteTitle: string;
  websiteDescription: string;
  logoUrl?: string;
  supportEmail: string;
  supportPhone?: string;
  country: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  commissionPercent: number;
  sellerAutoApproval: boolean;
  escrowHoldDays: number;
  returnWindowDays: number;
  freeShippingThresholdInr: number;
  codEnabled: boolean;
  codMaxLimitInr: number;
  themePreset: "editorial_luxury" | "minimal_modern" | "warm_atelier";
  heroHeadline: string;
  heroSubtitle: string;
  bannerEnabled: boolean;
  bannerText: string;
}

const DEFAULT_SETUP_CONFIG: MarketplaceSetupConfig = {
  marketplaceName: "NEXU ATELIER",
  websiteTitle: "NEXU ATELIER — Artisanal Marketplace & Heritage Goods",
  websiteDescription: "Curated multi-vendor marketplace connecting heritage artisans with patrons worldwide.",
  logoUrl: "/images/brand/logo.svg",
  supportEmail: "concierge@nexu.studio",
  supportPhone: "+91 98765 43210",
  country: "India",
  currency: "INR",
  currencySymbol: "₹",
  timezone: "Asia/Kolkata",
  commissionPercent: 12.5,
  sellerAutoApproval: false,
  escrowHoldDays: 7,
  returnWindowDays: 14,
  freeShippingThresholdInr: 5000,
  codEnabled: true,
  codMaxLimitInr: 15000,
  themePreset: "editorial_luxury",
  heroHeadline: "Artisanal Heritage, Modern Luxury",
  heroSubtitle: "Handcrafted masterworks curated directly from verified artisan studios.",
  bannerEnabled: true,
  bannerText: "Complimentary courier dispatch on all verified orders above ₹5,000",
};

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const settings = await prisma.platformSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const config: MarketplaceSetupConfig = {
      marketplaceName: map["site_title"] || DEFAULT_SETUP_CONFIG.marketplaceName,
      websiteTitle: map["site_title"] || DEFAULT_SETUP_CONFIG.websiteTitle,
      websiteDescription: map["site_description"] || DEFAULT_SETUP_CONFIG.websiteDescription,
      logoUrl: map["site_logo"] || DEFAULT_SETUP_CONFIG.logoUrl,
      supportEmail: map["support_email"] || DEFAULT_SETUP_CONFIG.supportEmail,
      supportPhone: map["footer_support_phone"] || DEFAULT_SETUP_CONFIG.supportPhone,
      country: map["business_country"] || DEFAULT_SETUP_CONFIG.country,
      currency: map["business_currency"] || DEFAULT_SETUP_CONFIG.currency,
      currencySymbol: map["currency_symbol"] || DEFAULT_SETUP_CONFIG.currencySymbol,
      timezone: map["business_timezone"] || DEFAULT_SETUP_CONFIG.timezone,
      commissionPercent: map["marketplace_commission_percent"]
        ? parseFloat(map["marketplace_commission_percent"])
        : DEFAULT_SETUP_CONFIG.commissionPercent,
      sellerAutoApproval: map["seller_auto_approval"] === "true",
      escrowHoldDays: map["escrow_clearance_hold_days"]
        ? parseInt(map["escrow_clearance_hold_days"], 10)
        : DEFAULT_SETUP_CONFIG.escrowHoldDays,
      returnWindowDays: map["patron_return_window_days"]
        ? parseInt(map["patron_return_window_days"], 10)
        : DEFAULT_SETUP_CONFIG.returnWindowDays,
      freeShippingThresholdInr: map["free_shipping_threshold_inr"]
        ? parseInt(map["free_shipping_threshold_inr"], 10)
        : DEFAULT_SETUP_CONFIG.freeShippingThresholdInr,
      codEnabled: map["cod_enabled"] !== "false",
      codMaxLimitInr: map["cod_max_limit_inr"]
        ? parseInt(map["cod_max_limit_inr"], 10)
        : DEFAULT_SETUP_CONFIG.codMaxLimitInr,
      themePreset: (map["theme_preset"] as any) || DEFAULT_SETUP_CONFIG.themePreset,
      heroHeadline: map["homepage_hero_headline"] || DEFAULT_SETUP_CONFIG.heroHeadline,
      heroSubtitle: map["homepage_hero_subtitle"] || DEFAULT_SETUP_CONFIG.heroSubtitle,
      bannerEnabled: map["homepage_banner_enabled"] !== "false",
      bannerText: map["homepage_banner_text"] || DEFAULT_SETUP_CONFIG.bannerText,
    };

    const categoriesCount = await prisma.category.count();
    const sellersCount = await prisma.seller.count();

    return NextResponse.json({
      config,
      stats: {
        categoriesCount,
        sellersCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load setup configuration." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body: Partial<MarketplaceSetupConfig> = await req.json();

    const pairs: { key: string; value: string; description: string }[] = [
      { key: "site_title", value: body.marketplaceName || DEFAULT_SETUP_CONFIG.marketplaceName, description: "Marketplace brand and site name" },
      { key: "site_description", value: body.websiteDescription || DEFAULT_SETUP_CONFIG.websiteDescription, description: "Meta description for search engines" },
      { key: "site_logo", value: body.logoUrl || DEFAULT_SETUP_CONFIG.logoUrl || "", description: "Header logo image path or URL" },
      { key: "support_email", value: body.supportEmail || DEFAULT_SETUP_CONFIG.supportEmail, description: "Official customer concierge email" },
      { key: "footer_support_phone", value: body.supportPhone || DEFAULT_SETUP_CONFIG.supportPhone || "", description: "Concierge telephone helpline" },
      { key: "business_country", value: body.country || DEFAULT_SETUP_CONFIG.country, description: "Base operating jurisdiction" },
      { key: "business_currency", value: body.currency || DEFAULT_SETUP_CONFIG.currency, description: "Primary currency code" },
      { key: "currency_symbol", value: body.currencySymbol || DEFAULT_SETUP_CONFIG.currencySymbol, description: "Display currency symbol" },
      { key: "business_timezone", value: body.timezone || DEFAULT_SETUP_CONFIG.timezone, description: "Operational time zone" },
      { key: "marketplace_commission_percent", value: String(body.commissionPercent ?? DEFAULT_SETUP_CONFIG.commissionPercent), description: "Default platform commission percentage" },
      { key: "seller_auto_approval", value: body.sellerAutoApproval ? "true" : "false", description: "Whether new sellers are approved automatically" },
      { key: "escrow_clearance_hold_days", value: String(body.escrowHoldDays ?? DEFAULT_SETUP_CONFIG.escrowHoldDays), description: "Holding period before seller funds become eligible for payout" },
      { key: "patron_return_window_days", value: String(body.returnWindowDays ?? DEFAULT_SETUP_CONFIG.returnWindowDays), description: "Customer return policy window in days" },
      { key: "free_shipping_threshold_inr", value: String(body.freeShippingThresholdInr ?? DEFAULT_SETUP_CONFIG.freeShippingThresholdInr), description: "Minimum order cart value for free delivery" },
      { key: "cod_enabled", value: body.codEnabled !== false ? "true" : "false", description: "Whether Cash on Delivery is enabled" },
      { key: "cod_max_limit_inr", value: String(body.codMaxLimitInr ?? DEFAULT_SETUP_CONFIG.codMaxLimitInr), description: "Maximum order cart value permitted for Cash on Delivery" },
      { key: "theme_preset", value: body.themePreset || DEFAULT_SETUP_CONFIG.themePreset, description: "Active storefront visual presentation theme" },
      { key: "homepage_hero_headline", value: body.heroHeadline || DEFAULT_SETUP_CONFIG.heroHeadline, description: "Primary hero headline" },
      { key: "homepage_hero_subtitle", value: body.heroSubtitle || DEFAULT_SETUP_CONFIG.heroSubtitle, description: "Hero subtitle description" },
      { key: "homepage_banner_enabled", value: body.bannerEnabled !== false ? "true" : "false", description: "Top announcement bar visibility" },
      { key: "homepage_banner_text", value: body.bannerText || DEFAULT_SETUP_CONFIG.bannerText, description: "Top announcement banner message" },
      { key: "marketplace_setup_completed", value: "true", description: "Marks initial marketplace setup wizard as complete" },
    ];

    const adminUserId = auth.context.user.id;

    await prisma.$transaction(async (tx) => {
      for (const item of pairs) {
        await tx.platformSetting.upsert({
          where: { key: item.key },
          update: { value: item.value, description: item.description, updatedBy: adminUserId },
          create: { key: item.key, value: item.value, description: item.description, updatedBy: adminUserId },
        });
      }
    });

    await securityAuditLedgerService.recordEvent({
      actorId: adminUserId,
      actorRole: "ADMIN",
      action: "MARKETPLACE_SETUP_CONFIGURED",
      targetType: "SYSTEM",
      targetId: "MARKETPLACE_SETTINGS",
      payload: {
        marketplaceName: body.marketplaceName,
        commissionPercent: body.commissionPercent,
        currency: body.currency,
        themePreset: body.themePreset,
        configuredKeysCount: pairs.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Marketplace setup saved successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update marketplace setup." },
      { status: 500 }
    );
  }
}
