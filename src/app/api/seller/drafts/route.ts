import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { supplierDraftService } from "@/lib/server/supplier-draft-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const draftKey = url.searchParams.get("draftKey");

    if (draftKey) {
      const draft = await supplierDraftService.getDraft(auth.seller.id, draftKey);
      return NextResponse.json({ success: true, draft });
    }

    const drafts = await supplierDraftService.listDrafts(auth.seller.id);
    return NextResponse.json({ success: true, drafts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve drafts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { draftKey, productId, title, categoryId, draftData, clientVersion } = body;

    if (!draftKey || typeof draftKey !== "string") {
      return NextResponse.json(
        { error: "Valid draftKey is required for autosave." },
        { status: 400 }
      );
    }

    const res = await supplierDraftService.saveDraft(auth.seller.id, {
      draftKey,
      productId,
      title,
      categoryId,
      draftData: draftData || {},
      clientVersion: typeof clientVersion === "number" ? clientVersion : 1,
    });

    if (res.conflict) {
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          serverDraft: res.serverDraft,
          error: res.error,
        },
        { status: 409 }
      );
    }

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, draft: res.draft });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save draft." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const draftKey = url.searchParams.get("draftKey");

    if (!draftKey) {
      return NextResponse.json({ error: "draftKey is required to discard draft." }, { status: 400 });
    }

    const discarded = await supplierDraftService.discardDraft(auth.seller.id, draftKey);
    return NextResponse.json({ success: discarded });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to discard draft." },
      { status: 500 }
    );
  }
}
