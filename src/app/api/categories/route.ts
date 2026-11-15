import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawCategories = await prisma.category.findMany({
      where: {
        NOT: [
          { name: { contains: "Test", mode: "insensitive" } },
          { name: { contains: "Tax Testing", mode: "insensitive" } },
          { slug: { startsWith: "tax-cat" } },
          { slug: { startsWith: "cust-cat" } },
        ],
        products: {
          some: {
            isPublished: true,
            approvalStatus: "APPROVED",
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
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
      },
    });

    const seenNames = new Map<string, typeof rawCategories[0]>();
    for (const cat of rawCategories) {
      const key = cat.name.trim().toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.set(key, cat);
      } else {
        const existing = seenNames.get(key)!;
        existing._count.products += cat._count.products;
      }
    }

    const categories = Array.from(seenNames.values()).filter(
      (c) => c._count.products > 0
    );

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}
