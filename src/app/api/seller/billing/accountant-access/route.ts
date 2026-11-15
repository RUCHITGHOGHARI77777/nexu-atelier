import { NextResponse } from "next/server";
import { getAuthenticatedSeller } from "@/lib/server/seller-auth-helper";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  const invitations = await prisma.accountantAccessInvitation.findMany({
    where: { sellerId: auth.seller.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, invitations });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, accountantName, firmName, financialYears, validityDays } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid accountant email is required." }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const days = validityDays || 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const invitation = await prisma.accountantAccessInvitation.create({
      data: {
        sellerId: auth.seller.id,
        email: email.trim().toLowerCase(),
        accountantName: accountantName || "Chartered Accountant",
        firmName: firmName || "Accounting Services",
        token,
        financialYears: financialYears || "ALL",
        expiresAt,
      },
    });

    const portalUrl = `/ca/portal/${token}`;

    return NextResponse.json({
      success: true,
      message: `Accountant access grant issued for ${email}.`,
      invitation: {
        ...invitation,
        portalUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create accountant invitation." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await getAuthenticatedSeller();
  if (!auth || !auth.seller) {
    return NextResponse.json({ error: "Unauthorized: Seller profile required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Invitation ID is required." }, { status: 400 });
    }

    await prisma.accountantAccessInvitation.delete({
      where: { id, sellerId: auth.seller.id },
    });

    return NextResponse.json({ success: true, message: "Access grant revoked successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to revoke access." },
      { status: 500 }
    );
  }
}

