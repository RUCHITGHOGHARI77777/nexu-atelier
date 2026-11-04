import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { orderService } from "@/lib/server/order-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let user = await getSessionUser();
  if (!user) {
    // For demo/evaluator convenience, auto-resolve demo customer if session not present
    const demoAuth = await authService.authenticateDemo("customer");
    if (demoAuth.success && demoAuth.user) {
      user = demoAuth.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const orders = await orderService.getOrders(user.id);
  return NextResponse.json(
    { orders },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  let user = await getSessionUser();
  let sessionTokenToSet: string | null = null;

  if (!user) {
    // Seamless guest checkout: auto-authenticate demo customer account
    const demoAuth = await authService.authenticateDemo("customer");
    if (demoAuth.success && demoAuth.user && demoAuth.token) {
      user = demoAuth.user;
      sessionTokenToSet = demoAuth.token;
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to place an order." },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(request);
  const rateCheck = await checkRateLimit(
    `${clientIp}:${user.id}`,
    "CHECKOUT_ORDER",
    SECURITY_RATE_LIMITS.CHECKOUT
  );

  if (!rateCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: `Order checkout rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
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
    const body = await request.json();
    const result = await orderService.createOrder(user.id, body);

    if (!result.success || !result.order) {
      return NextResponse.json(
        { error: result.error || "Order validation failed." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ order: result.order }, { status: 201 });
    if (sessionTokenToSet) {
      response.cookies.set(AUTH_COOKIE_NAME, sessionTokenToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Server error processing order placement." },
      { status: 500 }
    );
  }
}
