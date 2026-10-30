import { prisma } from "./prisma";

export class SitemapService {
  /**
   * Generates standard XML Sitemap Index linking to partitioned topic sitemaps.
   */
  public async generateSitemapIndexXml(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";
    const now = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemaps/products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/categories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/images.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  /**
   * Generates Products XML sitemap containing only eligible, approved, published database products.
   */
  public async generateProductsSitemapXml(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

    // Read out of stock policy setting
    const oosSetting = await prisma.platformSetting.findUnique({
      where: { key: "seo.indexing_policy_out_of_stock" },
    });
    const excludeOutOfStock = oosSetting?.value === "NOINDEX";

    const whereClause: any = {
      isPublished: true,
      approvalStatus: "APPROVED",
    };
    if (excludeOutOfStock) {
      whereClause.stock = { gt: 0 };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const urlsXml = products
      .map((p) => {
        return `  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
  }

  /**
   * Generates Category XML sitemap for catalog discovery.
   */
  public async generateCategoriesSitemapXml(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        name: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    const urlsXml = categories
      .map((c) => {
        return `  <url>
    <loc>${baseUrl}/catalog?category=${encodeURIComponent(c.name)}</loc>
    <lastmod>${c.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
  }

  /**
   * Generates Static and Legal Pages XML sitemap.
   */
  public generatePagesSitemapXml(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";
    const now = new Date().toISOString();

    const staticRoutes = [
      { path: "", priority: 1.0, changefreq: "daily" },
      { path: "/catalog", priority: 0.9, changefreq: "daily" },
      { path: "/about", priority: 0.7, changefreq: "monthly" },
      { path: "/contact", priority: 0.6, changefreq: "monthly" },
      { path: "/faq", priority: 0.6, changefreq: "weekly" },
      { path: "/help", priority: 0.6, changefreq: "weekly" },
      { path: "/promotions", priority: 0.7, changefreq: "weekly" },
      { path: "/policies/shipping", priority: 0.4, changefreq: "monthly" },
      { path: "/policies/cancellation", priority: 0.4, changefreq: "monthly" },
      { path: "/policies/privacy", priority: 0.4, changefreq: "monthly" },
      { path: "/policies/terms", priority: 0.4, changefreq: "monthly" },
      { path: "/policies/refunds", priority: 0.4, changefreq: "monthly" },
    ];

    const urlsXml = staticRoutes
      .map((r) => {
        return `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
  }

  /**
   * Generates Google Image Sitemap containing indexed high-resolution photography.
   */
  public async generateImageSitemapXml(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        approvalStatus: "APPROVED",
      },
      select: {
        title: true,
        slug: true,
        updatedAt: true,
        images: {
          select: {
            url: true,
            alt: true,
            title: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
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

    const urlsXml = products
      .map((p) => {
        if (!p.images || p.images.length === 0) return "";

        const imagesXml = p.images
          .map((img) => {
            return `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title || p.title)}</image:title>
      <image:caption>${escapeXml(img.alt || p.title)}</image:caption>
    </image:image>`;
          })
          .join("\n");

        return `  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
${imagesXml}
  </url>`;
      })
      .filter(Boolean)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
  }
}

export const sitemapService = new SitemapService();
