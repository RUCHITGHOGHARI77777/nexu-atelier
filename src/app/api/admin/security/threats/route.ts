import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { antiFraudRuleEngine } from "@/lib/server/anti-fraud-rule-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";

  try {
    const threats = await antiFraudRuleEngine.getThreatSignals(status);
    return NextResponse.json({ success: true, threats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load threat signals." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { signalId, status, notes } = body;

    if (!signalId || !status) {
      return NextResponse.json({ error: "signalId and status are required." }, { status: 400 });
    }

    const updated = await antiFraudRuleEngine.resolveThreatSignal(signalId, status, notes);
    return NextResponse.json({
      success: true,
      message: `Threat signal marked as ${status}.`,
      threat: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resolve threat signal." },
      { status: 500 }
    );
  }
}

