import { MetadataRoute } from "next";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

  const staticRoutes: MetadataRoute.Sitemap = [
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
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : route.startsWith("/policies") ? 0.4 : 0.8,
  }));

  try {
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        approvalStatus: "APPROVED",
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 1000,
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
