import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { customerPrivacyService } from "@/lib/server/customer-privacy-service";

export const dynamic = "force-dynamic";

/**
 * Customer Privacy & Consent Center API
 * Handles DPDP Act 2023 consent records, retention preferences, and profile status.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const profile = await customerPrivacyService.getCustomerPrivacyProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Customer profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve privacy profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await customerPrivacyService.updateConsentPreferences(user.id, {
      consentMarketing: body.consentMarketing,
      consentWhatsapp: body.consentWhatsapp,
      consentAnalytics: body.consentAnalytics,
      dataRetentionPreference: body.dataRetentionPreference,
    });

    return NextResponse.json({
      success: true,
      profile: updated,
      message: "Privacy and consent preferences updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update consent preferences." },
      { status: 400 }
    );
  }
}
