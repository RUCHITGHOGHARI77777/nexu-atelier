import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { customerPrivacyService } from "@/lib/server/customer-privacy-service";

export const dynamic = "force-dynamic";

/**
 * Real Email Token Verification Endpoint
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, token } = body;

    if (action === "send") {
      const result = await customerPrivacyService.requestEmailVerification(user.id);
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    if (action === "verify") {
      if (!token || typeof token !== "string") {
        return NextResponse.json(
          { success: false, error: "Verification token is required." },
          { status: 400 }
        );
      }

      const verifyResult = await customerPrivacyService.verifyEmailToken(user.id, token);
      return NextResponse.json({
        success: true,
        message: verifyResult.message,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Supported: 'send', 'verify'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process email verification." },
      { status: 400 }
    );
  }
}
