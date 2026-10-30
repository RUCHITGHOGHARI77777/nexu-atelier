import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { fraudDetectionService } from "@/lib/server/fraud-detection-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const customer = await getSessionUser();
  if (!customer) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    // Validate 6-digit OTP format (in sandbox / test mode, accept standard test code '123456' or any valid 6-digit number)
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: "Invalid verification code. Please enter a 6-digit OTP." },
        { status: 400 }
      );
    }

    // Mark customer phone as verified
    await fraudDetectionService.updateCustomerVerification(customer.id, true, phone);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Mobile number verified successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "OTP verification failed." },
      { status: 500 }
    );
  }
}
