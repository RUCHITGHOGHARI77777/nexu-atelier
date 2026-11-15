import { NextResponse } from "next/server";
import { performComprehensiveHealthCheck } from "@/lib/server/error-recovery-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await performComprehensiveHealthCheck();

    return NextResponse.json(
      {
        ...health,
        database: health.subsystems.database.status,
      },
      {
        status: health.status === "unhealthy" ? 503 : 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
