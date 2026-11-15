import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to export account archive." },
        { status: 401 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        addresses: true,
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    await prisma.auditEvent.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        action: "DATA_ARCHIVE_EXPORTED",
        performedBy: user.email,
        note: "Patron downloaded their personal data archive under data sovereignty policy.",
      },
    });

    const exportPayload = {
      platform: "Nexu Atelier",
      exportedAt: new Date().toISOString(),
      patron: userData,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nexu-patron-archive-${user.id}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate data archive." },
      { status: 500 }
    );
  }
}
