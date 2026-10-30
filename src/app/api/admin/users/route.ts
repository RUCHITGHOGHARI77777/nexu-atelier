import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth-helper";
import { adminService } from "@/lib/server/admin-service";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const users = await adminService.getUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve user accounts." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: "Valid userId and role (CUSTOMER, SELLER, ADMIN) are required." },
        { status: 400 }
      );
    }

    const res = await adminService.updateUserRole(userId, role as UserRole, auth.context.user.id);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user role." },
      { status: 500 }
    );
  }
}
