import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("q")?.trim() || "";

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.slug }, { slug: params.slug }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const questions = await prisma.productQuestion.findMany({
      where: {
        productId: product.id,
        ...(search
          ? {
              question: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
      },
      include: {
        answers: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: [
        { upvotes: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load product questions." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to ask a craft question." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(
      `${clientIp}:${user.id}`,
      "SUBMIT_QA",
      SECURITY_RATE_LIMITS.SUBMIT_QA
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Inquiry submission rate limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
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

    const body = await req.json();

    // Honeypot check
    if (body._hp_company_website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const rawQuestion = typeof body.question === "string" ? body.question : "";
    const cleanQuestion = sanitizeText(rawQuestion, 500);

    if (!cleanQuestion || cleanQuestion.length < 5) {
      return NextResponse.json(
        { error: "Question must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.slug }, { slug: params.slug }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const question = await prisma.productQuestion.create({
      data: {
        productId: product.id,
        authorName: sanitizeText(user.name || "Verified Patron", 50),
        question: cleanQuestion,
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit question." },
      { status: 500 }
    );
  }
}
