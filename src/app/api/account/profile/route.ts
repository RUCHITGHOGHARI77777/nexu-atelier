import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { authService } from "@/lib/server/auth-service";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await authService.updateProfile(user.id, body);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Failed to update profile." },
        { status: 400 }
      );
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json(
      { error: "Server error updating customer profile." },
      { status: 500 }
    );
  }
}
