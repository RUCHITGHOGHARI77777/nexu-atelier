import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminManagementService } from "@/lib/server/admin-management-service";

export const dynamic = "force-dynamic";

/**
 * Admin Operational Contact Logging & Dialer Generation API
 *
 * Implements strict DPDP Act & Privacy safeguards:
 * - Requires explicit administrative business purpose (e.g. DELIVERY_ISSUE, FRAUD_INVESTIGATION).
 * - Requires mandatory audit explanation / notes.
 * - Logs admin ID, timestamp, and target entity in immutable audit records.
 * - Generates device dialer link (tel:+91...) without auto-calling or illegal audio recording.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { targetType, targetId, purpose, note, notes } = body;

    const contactNotes = note || notes;
    if (!targetType || !targetId || !purpose || !contactNotes) {
      return NextResponse.json(
        {
          error: "Mandatory fields missing: targetType ('CUSTOMER'|'SUPPLIER'), targetId, purpose, and detailed note.",
        },
        { status: 400 }
      );
    }

    const result = await adminManagementService.initiateOperationalContact(
      auth.context.user.id,
      {
        targetType,
        targetId,
        purpose,
        notes: contactNotes,
      }
    );

    return NextResponse.json({
      success: true,
      logId: result.logId,
      dialerUrl: result.dialerUri,
      timestamp: result.initiatedAt,
      message: "Operational contact action successfully logged in compliance audit register.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log operational contact action." },
      { status: 400 }
    );
  }
}
