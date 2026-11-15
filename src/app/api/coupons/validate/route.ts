import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/server/admin-service";
import { getSessionUser } from "@/lib/server/session-helper";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { sanitizeText } from "@/lib/server/sanitizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    const rateCheck = await checkRateLimit(
      clientIp,
      "COUPON_VALIDATE",
      SECURITY_RATE_LIMITS.COUPON_VALIDATE
    );

    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({
          valid: false,
          error: `Too many coupon validation requests. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
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
    const { code, subtotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    const cleanCode = sanitizeText(code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const subtotalPaise = subtotal ? Math.round(Number(subtotal) * 100) : 0;
    const session = await getSessionUser();

    const result = await adminService.validateAndApplyCoupon(
      cleanCode,
      subtotalPaise,
      session?.id
    );

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discountINR: Math.round(result.discountPaise / 100),
      discountPaise: result.discountPaise,
      coupon: result.coupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to validate coupon." },
      { status: 500 }
    );
  }
}
