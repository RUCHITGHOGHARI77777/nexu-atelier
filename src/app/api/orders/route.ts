import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { orderService } from "@/lib/server/order-service";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const orders = await orderService.getOrders(user.id);
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
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

    return NextResponse.json({ order: result.order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error processing order placement." },
      { status: 500 }
    );
  }
}
