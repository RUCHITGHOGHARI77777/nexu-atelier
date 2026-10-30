import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { reviewService, ReviewError } from "@/lib/server/review-service";
import { ReviewFilterOptions } from "@/types/review";
import { prisma } from "@/lib/server/prisma";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText, isSafeMediaUrl } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;
    const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!, 10) : undefined;
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const hasMediaOnly = searchParams.get("hasMediaOnly") === "true";
    const sort = (searchParams.get("sort") as any) || "recent";

    const filterOptions: ReviewFilterOptions = {
      page,
      limit,
      rating,
      verifiedOnly,
      hasMediaOnly,
      sort,
    };

    // Support either ID or Slug in the URL path
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.slug }, { slug: params.slug }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const result = await reviewService.getProductReviews(product.id, filterOptions, sessionUser?.id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load product reviews." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to submit a review." },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimit(
    `${clientIp}:${user.id}`,
    "SUBMIT_REVIEW",
    SECURITY_RATE_LIMITS.SUBMIT_REVIEW
  );

  if (!rateCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: `Review submission rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": rateCheck.retryAfterSeconds.toString(),
        },
      }
    );
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.slug }, { slug: params.slug }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = await req.json();

    // Honeypot check
    if (body._hp_company_website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    // Sanitize user text inputs
    const cleanTitle = sanitizeText(body.title || "", 120);
    const cleanComment = sanitizeText(body.comment || "", 3000);

    // Sanitize media URLs (prevent SSRF and XSS)
    const sanitizedMediaUrls = Array.isArray(body.mediaUrls)
      ? body.mediaUrls.filter((url: any) =>
          typeof url === "string" && isSafeMediaUrl(url, ["images.unsplash.com", "plus.unsplash.com"])
        )
      : [];

    const review = await reviewService.createReview(
      {
        productId: product.id,
        orderItemId: body.orderItemId,
        rating: body.rating,
        title: cleanTitle,
        comment: cleanComment,
        mediaUrls: sanitizedMediaUrls,
        variantSku: body.variantSku ? sanitizeText(body.variantSku, 50) : undefined,
        variantName: body.variantName ? sanitizeText(body.variantName, 50) : undefined,
      },
      user.id
    );

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || "Internal server error submitting review." },
      { status: 500 }
    );
  }
}
