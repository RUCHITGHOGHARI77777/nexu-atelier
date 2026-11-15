import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { disputeEvidenceService } from "@/lib/server/dispute-evidence-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("packageId");

  try {
    if (packageId) {
      const result = await disputeEvidenceService.getEvidencePackageForDownload(packageId, auth.context.user.id);
      return NextResponse.json({ success: true, ...result });
    }

    const packages = await disputeEvidenceService.listPackages();
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve dispute evidence." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { orderId, disputeId, evidenceType, investigationNotes } = body;

    if (!orderId || !evidenceType) {
      return NextResponse.json({ error: "orderId and evidenceType are required." }, { status: 400 });
    }

    const dossier = await disputeEvidenceService.compileDossier({
      orderId,
      disputeId,
      evidenceType,
      compiledByAdminId: auth.context.user.id,
      investigationNotes,
    });

    return NextResponse.json({
      success: true,
      message: "Dispute legal evidence dossier compiled and cryptographically sealed.",
      dossier,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compile dispute evidence dossier." },
      { status: 500 }
    );
  }
}

