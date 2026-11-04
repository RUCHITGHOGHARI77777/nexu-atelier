import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/server/prisma";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowRight, Layers, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Disciplines & Categories | NEXU ATELIER",
  description:
    "Explore our complete range of artisanal disciplines: heritage handloom silks, precision acoustic monitors, Goodyear-welted leathercraft, and architectural living objects.",
  openGraph: {
    title: "Atelier Disciplines & Categories | NEXU ATELIER",
    description:
      "Explore verified maker disciplines directly sourced from heritage looms, acoustic laboratories, and sand-casting studios.",
  },
};

export default async function CategoriesHubPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: {
            where: {
              isPublished: true,
              approvalStatus: "APPROVED",
            },
          },
        },
      },
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

  const jsonLd = {
    "@context": "https://schema.org",
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
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 sm:py-16 text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-mono text-zinc-700 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>DISCIPLINE ARCHIVE & TAXONOMY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950">
            Curated Guild Disciplines
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Every category represents dedicated artisan guilds, master looms, and precision labs creating heirloom-quality pieces without industrial mass-production shortcuts.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const subcategories = category.products
              .map((p) => p.subcategory)
              .filter(Boolean) as string[];

            return (
              <div
                key={category.id}
                className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Category Visual */}
                  <div className="relative aspect-[16/10] w-full bg-zinc-100 overflow-hidden">
                    <ImageWithFallback
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs font-semibold">
                        {category._count.products} pieces
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                      <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-xs">
                        {category.name}
                      </h2>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {category.description}
                    </p>

                    {/* Subcategories tags */}
                    {subcategories.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 block font-medium">
                          Active Crafts:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {subcategories.map((sub) => (
                            <Link
                              key={sub}
                              href={`/category/${category.slug}?sub=${encodeURIComponent(sub)}`}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-zinc-200/80 text-zinc-700 transition-colors"
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/category/${category.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border border-[#171717] hover:border-[#B78B45] font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <span>Explore {category.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
