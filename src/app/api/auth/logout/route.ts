import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authService } from "@/lib/server/auth-service";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      await authService.logout(token);
    }
    cookieStore.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return NextResponse.json({ success: true, message: "Signed out securely." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sign out cleanly." },
      { status: 500 }
    );
  }
}
