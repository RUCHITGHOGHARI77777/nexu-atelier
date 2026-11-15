import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = (params.slug || "").trim().toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { error: "Seller slug is required." },
        { status: 400 }
      );
    }

    const seller = await prisma.seller.findUnique({
      where: { slug },
      include: {
        products: {
          where: {
            isPublished: true,
            approvalStatus: "APPROVED",
          },
          include: {
            images: {
              orderBy: { sortOrder: "asc" },
            },
            category: {
              select: { name: true, slug: true },
            },
            variants: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: `Artisan Studio with slug "${slug}" not found.` },
        { status: 404 }
      );
    }

    const products = seller.products.map((p) => {
      const primaryImage =
        p.images.find((img) => img.isPrimary)?.url ||
        p.images[0]?.url ||
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

      const allImages =
        p.images.length > 0
          ? p.images.map((img) => img.url)
          : [primaryImage];

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle || `${seller.name} Original`,
        description: p.description,
        category: p.category?.name || "Apparel",
        vendor: {
          id: seller.id,
          name: seller.name,
          slug: seller.slug,
          location: seller.originHub || "India",
          tagline: seller.story || "Heritage Maker",
          story: seller.story || "",
          rating: seller.rating || 5.0,
          totalSales: 150,
          verifiedSince: seller.createdAt.getFullYear().toString(),
          dispatchTime: `${seller.leadTimeDays || 3} days`,
          avatarUrl: seller.heroImage || primaryImage,
        },
        basePrice: p.basePricePaise / 100,
        compareAtPrice: p.compareAtPricePaise ? p.compareAtPricePaise / 100 : undefined,
        currency: "INR" as const,
        stock: p.stock,
        rating: p.rating || 5.0,
        reviewCount: p.ratingCount || 1,
        images: allImages,
        tags: ["Artisan", "Handcrafted", seller.name],
        specifications: [
          { label: "Origin Hub", value: seller.originHub || "India" },
          { label: "Studio", value: seller.name },
        ],
        highlights: [
          "100% Handcrafted Provenance",
          "Direct Studio Dispatch",
          "Escrow Protection",
        ],
        materials: p.material || "Natural Artisan Materials",
        estimatedDeliveryDays: (seller.leadTimeDays || 3) + 2,
        isFeatured: p.isFeatured,
        isTrending: p.isBestseller,
      };
    });

    return NextResponse.json({
      seller: {
        id: seller.id,
        slug: seller.slug,
        name: seller.name,
        originHub: seller.originHub,
        story: seller.story,
        heroImage: seller.heroImage,
        verified: seller.verified,
        rating: seller.rating,
        leadTimeDays: seller.leadTimeDays,
        status: seller.status,
        taxIdentifier: seller.taxIdentifier,
        activeProductsCount: products.length,
        createdAt: seller.createdAt.toISOString(),
      },
      products,
    });
  } catch (error: any) {
    console.error("Failed to fetch seller profile:", error);
    return NextResponse.json(
      { error: "Internal server error fetching seller profile." },
      { status: 500 }
    );
  }
}
