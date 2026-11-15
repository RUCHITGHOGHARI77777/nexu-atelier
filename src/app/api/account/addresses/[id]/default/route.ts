import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { addressRepository } from "@/lib/server/address-repository";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const result = await addressRepository.setDefaultAddress(user.id, params.id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to set default address." },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
