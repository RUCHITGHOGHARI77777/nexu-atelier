import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { productRepository } from "@/lib/server/product-repository";
import { slugRedirectService } from "@/lib/server/slug-redirect-service";
import { ProductShowcase } from "@/components/product/ProductShowcase";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { FrequentlyBoughtTogether } from "@/components/product/FrequentlyBoughtTogether";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductQA } from "@/components/product/ProductQA";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  // Check for 301 slug redirect
  const redirectTarget = await slugRedirectService.getRedirectForSlug(params.slug);
  if (redirectTarget) {
    redirect(`/product/${redirectTarget}`);
  }

  const product = await productRepository.getProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product Not Found — Nexu Atelier",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";
  const canonicalUrl = `${baseUrl}/product/${product.slug}`;
  const pageTitle = `${product.title} — ${product.vendor.name} | Nexu Atelier`;
  const metaDesc = product.description.slice(0, 160);
  const primaryImage = product.images.length > 0 ? product.images[0] : `${baseUrl}/og-default.jpg`;

  return {
    title: pageTitle,
    description: metaDesc,
    keywords: [
      product.category,
      product.vendor.name,
      "handcrafted",
      "artisan luxury",
      "authentic Indian heritage",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: metaDesc,
      url: canonicalUrl,
      siteName: "Nexu Atelier",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 800,
          alt: `${product.title} by ${product.vendor.name}`,
        },
      ],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: metaDesc,
      images: [primaryImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  // Check for 301 slug redirect
  const redirectTarget = await slugRedirectService.getRedirectForSlug(params.slug);
  if (redirectTarget) {
    redirect(`/product/${redirectTarget}`);
  }

  const product = await productRepository.getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Fetch real related pieces from same category if available
  let relatedProducts: any[] = [];
  try {
    const relatedResult = await productRepository.getProducts({
      category: product.category,
      limit: 6,
    });
    relatedProducts = relatedResult.products.filter((p) => p.id !== product.id);
  } catch {
    // fallback gracefully
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";
  const canonicalUrl = `${baseUrl}/product/${product.slug}`;

  // Structured Data (JSON-LD) - Strict Schema.org compliance without fabricated reviews
  const productJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    sku: product.id,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: product.vendor.name,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: product.basePrice,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.vendor.name,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0.00",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  // Only attach aggregateRating if genuine reviews exist
  if (product.reviewCount && product.reviewCount > 0 && product.rating && product.rating > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  // Breadcrumbs JSON-LD
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalog",
        item: `${baseUrl}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: `${baseUrl}/catalog?category=${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumbs"
        className="flex items-center gap-2 text-xs text-zinc-500 font-medium"
      >
        <Link href="/" className="hover:text-zinc-950 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <Link href="/catalog" className="hover:text-zinc-950 transition-colors">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <Link
          href={`/catalog?category=${encodeURIComponent(product.category)}`}
          className="hover:text-zinc-950 transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-900 truncate max-w-xs font-semibold">{product.title}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <ProductShowcase product={product} />

      {/* Specifications & Materials */}
      <ProductSpecs product={product} />

      {/* Frequently Bought Together Ensemble */}
      <FrequentlyBoughtTogether
        mainProduct={product}
        companionProducts={relatedProducts}
      />

      {/* Customer Reviews & Reputation */}
      <ProductReviews productId={product.id} productTitle={product.title} />

      {/* Atelier Craft Dialogue & Q&A */}
      <ProductQA
        productId={product.id}
        productSlug={product.slug}
        productTitle={product.title}
      />

      {/* Related Pieces from Same Category */}
      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
        relatedProducts={relatedProducts}
      />

      {/* Patron Browsing Trail */}
      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}
