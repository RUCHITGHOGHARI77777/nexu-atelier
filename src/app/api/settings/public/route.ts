import { NextResponse } from "next/server";
import { adminService } from "@/lib/server/admin-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await adminService.getPublicSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load public settings." },
      { status: 500 }
    );
  }
}
