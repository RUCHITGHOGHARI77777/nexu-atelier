import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { SEED_PRODUCTS } from "@/data/seedCatalog";
import { productRepository } from "@/lib/server/product-repository";
import { ProductShowcase } from "@/components/product/ProductShowcase";
import { ProductSpecs } from "@/components/product/ProductSpecs";
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
  const dbProduct = await productRepository.getProductBySlug(params.slug);
  const product = dbProduct || SEED_PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) {
    return {
      title: "Product Not Found — Nexu Atelier",
    };
  }

  return {
    title: `${product.title} — ${product.vendor.name} | Nexu Atelier`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Nexu Atelier`,
      description: product.description,
      images: product.images.length > 0 ? [{ url: product.images[0] }] : [],
    },
    alternates: {
      canonical: `/product/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const dbProduct = await productRepository.getProductBySlug(params.slug);
  const product = dbProduct || SEED_PRODUCTS.find((p) => p.slug === params.slug);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.vendor.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.basePrice,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.vendor.name,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 1,
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
