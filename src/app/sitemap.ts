import { MetadataRoute } from "next";
import { SEED_PRODUCTS } from "@/data/seedCatalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

  const staticRoutes = [
    "",
    "/catalog",
    "/about",
    "/contact",
    "/faq",
    "/help",
    "/promotions",
    "/policies/shipping",
    "/policies/cancellation",
    "/policies/privacy",
    "/policies/terms",
    "/policies/refunds",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : route.startsWith("/policies") ? 0.4 : 0.8,
  }));

  const productRoutes = SEED_PRODUCTS.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
