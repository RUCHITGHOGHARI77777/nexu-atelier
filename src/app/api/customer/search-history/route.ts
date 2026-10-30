import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import {
  getRecentSearchQueries,
  recordSearchQuery,
  clearSearchHistory,
} from "@/lib/server/personalization-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ queries: [] });
  }

  try {
    const queries = await getRecentSearchQueries(user.id);
    return NextResponse.json({ queries });
  } catch (err: any) {
    return NextResponse.json({ queries: [] });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, reason: "Unauthenticated" });
  }

  try {
    const body = await request.json();
    if (!body.query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    await recordSearchQuery(user.id, body.query);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record search" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearSearchHistory(user.id);
    return NextResponse.json({ success: true, queries: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clear search history" }, { status: 500 });
  }
}
