import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      where: {
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        story: true,
        originHub: true,
        heroImage: true,
        verified: true,
        rating: true,
        leadTimeDays: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: {
                isPublished: true,
                approvalStatus: { in: ["APPROVED", "PENDING_REVIEW"] },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ sellers, total: sellers.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch artisans" },
      { status: 500 }
    );
  }
}
