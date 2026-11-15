import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { dualApprovalService } from "@/lib/server/dual-approval-service";
import { sellerBankProtectionService } from "@/lib/server/seller-bank-protection-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";

  try {
    const requests = await dualApprovalService.listRequests(status);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list dual-approval requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { requestId, action, notes } = body; // action: "APPROVE" | "REJECT"

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing required fields: requestId, action." }, { status: 400 });
    }

    if (action === "APPROVE") {
      const approved = await dualApprovalService.approveRequest({
        requestId,
        approvingAdminId: auth.context.user.id,
        notes,
      });

      if (approved.actionType === "BANK_ACCOUNT_CHANGE") {
        await sellerBankProtectionService.applyApprovedBankChange(approved.targetEntityId, auth.context.user.id);
      }

      return NextResponse.json({
        success: true,
        message: "Dual-approval granted and operation successfully executed.",
        request: approved,
      });
    } else if (action === "REJECT") {
      const rejected = await dualApprovalService.rejectRequest({
        requestId,
        rejectingAdminId: auth.context.user.id,
        reason: notes || "Rejected by secondary administrator.",
      });

      return NextResponse.json({
        success: true,
        message: "Dual-approval request rejected.",
        request: rejected,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Expected APPROVE or REJECT." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process dual-approval decision." },
      { status: 400 }
    );
  }
}

