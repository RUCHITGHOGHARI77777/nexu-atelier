import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const question = await prisma.productQuestion.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const updated = await prisma.productQuestion.update({
      where: { id: params.id },
      data: {
        upvotes: {
          increment: 1,
        },
      },
      select: {
        id: true,
        upvotes: true,
      },
    });

    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upvote question." },
      { status: 500 }
    );
  }
}
