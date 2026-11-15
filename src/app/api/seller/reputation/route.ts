import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { reviewService } from "@/lib/server/review-service";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json(
      { error: "Seller authentication required." },
      { status: 401 }
    );
  }

  try {
    const scorecard = await reviewService.getSellerReputation(auth.seller.id);

    const sellerProducts = await prisma.product.findMany({
      where: { vendorId: auth.seller.id },
      select: { id: true },
    });
    const productIds = sellerProducts.map((p) => p.id);

    const reviews = await prisma.productReview.findMany({
      where: { productId: { in: productIds } },
      include: {
        product: { select: { title: true } },
        customer: { select: { profile: { select: { name: true } } } },
        sellerResponse: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const recentFeedbacks = await prisma.sellerFeedback.findMany({
      where: { sellerId: auth.seller.id },
      include: {
        customer: { select: { profile: { select: { name: true } } } },
        order: { select: { id: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      scorecard,
      reviews,
      recentFeedbacks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load seller reputation." },
      { status: 500 }
    );
  }
}
