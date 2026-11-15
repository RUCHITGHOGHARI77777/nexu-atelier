import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to answer craft inquiries." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    const rateCheck = await checkRateLimit(
      `${clientIp}:${user.id}`,
      "SUBMIT_ANSWER",
      SECURITY_RATE_LIMITS.SUBMIT_QA
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: `Answer submission rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
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

    const question = await prisma.productQuestion.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const body = await req.json();

    if (body._hp_company_website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const rawAnswer = typeof body.answer === "string" ? body.answer : "";
    const cleanAnswer = sanitizeText(rawAnswer, 1000);

    if (!cleanAnswer || cleanAnswer.length < 5) {
      return NextResponse.json(
        { error: "Answer must be at least 5 characters long." },
        { status: 400 }
      );
    }

    let authorRole: "STUDIO_ARTISAN" | "VERIFIED_BUYER" | "COMMUNITY" = "COMMUNITY";

    if (user.role === "seller" || user.role === "admin") {
      authorRole = "STUDIO_ARTISAN";
    } else {
      const pastPurchase = await prisma.orderItem.findFirst({
        where: {
          productId: question.productId,
          order: {
            customerId: user.id,
            status: { not: "CANCELLED" },
          },
        },
      });

      if (pastPurchase) {
        authorRole = "VERIFIED_BUYER";
      }
    }

    const answer = await prisma.productAnswer.create({
      data: {
        questionId: question.id,
        authorName: sanitizeText(user.name || "Patron", 50),
        authorRole,
        answer: cleanAnswer,
      },
    });

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit answer." },
      { status: 500 }
    );
  }
}
