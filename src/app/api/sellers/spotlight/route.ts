import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seller = await prisma.seller.findFirst({
      where: {
        verified: true,
        status: "APPROVED",
        products: {
          some: {
            isPublished: true,
            approvalStatus: "APPROVED",
          },
        },
      },
      orderBy: [
        { rating: "desc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        originHub: true,
        story: true,
        heroImage: true,
        verified: true,
        rating: true,
        leadTimeDays: true,
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

    if (!seller) {
      return NextResponse.json({ error: "No spotlight seller available." }, { status: 404 });
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Failed to fetch spotlight seller:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
