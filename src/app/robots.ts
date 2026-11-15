import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/product/*",
          "/catalog",
          "/catalog/*",
          "/about",
          "/contact",
          "/faq",
          "/help",
          "/promotions",
          "/policies/*",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/seller",
          "/seller/*",
          "/supplier",
          "/supplier/*",
          "/account",
          "/account/*",
          "/checkout",
          "/checkout/*",
          "/cart",
          "/api/*",
          "/compare",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/product/*",
          "/catalog/*",
        ],
        disallow: [
          "/admin/*",
          "/seller/*",
          "/account/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
