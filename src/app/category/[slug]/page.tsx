import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/server/prisma";
import { productRepository } from "@/lib/server/product-repository";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ChevronRight, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: { slug: string };
  searchParams?: {
    sub?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return { title: "Category Not Found | NEXU ATELIER" };
  }

  return {
    title: `${category.name} — Curated Discipline | NEXU ATELIER`,
    description: category.description,
    openGraph: {
      title: `${category.name} | NEXU ATELIER`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        where: {
          isPublished: true,
          approvalStatus: "APPROVED",
          subcategory: { not: null },
        },
        select: {
          subcategory: true,
        },
        distinct: ["subcategory"],
      },
    },
  });

  if (!category) {
    notFound();
  }

  const selectedSub = searchParams?.sub;
  const sortParam = searchParams?.sort;
  let repoSort: "price-asc" | "price-desc" | "rating" | "newest" = "newest";
  if (sortParam === "price_asc") repoSort = "price-asc";
  else if (sortParam === "price_desc") repoSort = "price-desc";
  else if (sortParam === "rating") repoSort = "rating";

  const { products: fetchedProducts } = await productRepository.getProducts({
    category: category.name,
    sortBy: repoSort,
    limit: 48,
  });

  // Filter products by subcategory if specified
  const products = selectedSub
    ? fetchedProducts.filter((p) => {
        // Match specifications or category
        const subSpec = p.specifications?.find((s) => s.label === "Subcategory");
        return subSpec ? subSpec.value.toLowerCase() === selectedSub.toLowerCase() : true;
      })
    : fetchedProducts;

  // Extract distinct subcategories
  const allSubcategories = Array.from(
    new Set(category.products.map((p) => p.subcategory).filter(Boolean) as string[])
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Collection`,
    description: category.description,
    url: `https://nexu.studio/category/${category.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://nexu.studio",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Disciplines",
          item: "https://nexu.studio/categories",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: `https://nexu.studio/category/${category.slug}`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 py-8 sm:py-12 text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-zinc-500 font-mono"
        >
          <Link href="/" className="hover:text-zinc-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/categories" className="hover:text-zinc-950 transition-colors">
            Disciplines
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-900 font-bold">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>DISCIPLINE SHOWCASE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              {category.name}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          {/* Subcategories Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Link
              href={`/category/${category.slug}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                !selectedSub
                  ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              All {category.name} ({fetchedProducts.length})
            </Link>

            {allSubcategories.map((sub) => (
              <Link
                key={sub}
                href={`/category/${category.slug}?sub=${encodeURIComponent(sub)}${
                  sortParam ? `&sort=${sortParam}` : ""
                }`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  selectedSub === sub
                    ? "bg-white text-[#171717] border-2 border-[#171717] shadow-xs font-bold"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {sub}
              </Link>
            ))}
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-zinc-600">
            <span className="font-mono text-[11px] text-zinc-600 font-medium">Sort:</span>
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg p-1">
              <Link
                href={`/category/${category.slug}?sort=newest${
                  selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ""
                }`}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  repoSort === "newest"
                    ? "bg-[#FAFAF8] text-[#171717] font-bold border border-[#E8E8E4] shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/category/${category.slug}?sort=price_asc${
                  selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ""
                }`}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  repoSort === "price-asc"
                    ? "bg-[#FAFAF8] text-[#171717] font-bold border border-[#E8E8E4] shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/category/${category.slug}?sort=price_desc${
                  selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ""
                }`}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  repoSort === "price-desc"
                    ? "bg-[#FAFAF8] text-[#171717] font-bold border border-[#E8E8E4] shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-4">
            <p className="text-zinc-600 text-sm">
              No pieces currently active in this selection.
            </p>
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] text-xs font-semibold shadow-xs"
            >
              <span>View all {category.name}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
