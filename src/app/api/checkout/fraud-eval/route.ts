import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { fraudDetectionService } from "@/lib/server/fraud-detection-service";
import { FraudEvaluationInput } from "@/types/payment-fraud";
import { authService } from "@/lib/server/auth-service";
import { isDemoMode } from "@/lib/server/demo-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let customer = await getSessionUser();
  if (!customer && isDemoMode()) {
    const demoAuth = await authService.authenticateDemo("customer");
    if (demoAuth.success && demoAuth.user) {
      customer = demoAuth.user;
    }
  }
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { shippingAddress, items, totalPaise, paymentMethod, isPhoneVerified } = body;

    if (!shippingAddress || !items || typeof totalPaise !== "number") {
      return NextResponse.json(
        { error: "Invalid payload: shippingAddress, items, and totalPaise are required." },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const input: FraudEvaluationInput = {
      customerId: customer.id,
      email: customer.email,
      phone: shippingAddress.phone || customer.phone || undefined,
      isPhoneVerified: Boolean(isPhoneVerified ?? (customer as any).isPhoneVerified),
      shippingAddress,
      items,
      totalPaise,
      paymentMethod,
      ipAddress,
      userAgent,
    };

    const result = await fraudDetectionService.evaluateOrderRisk(input);
    return NextResponse.json({ success: true, risk: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to evaluate order risk." },
      { status: 500 }
    );
  }
}
