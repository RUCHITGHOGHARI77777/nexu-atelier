import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { addressRepository } from "@/lib/server/address-repository";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const addresses = await addressRepository.getAddresses(user.id);
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await addressRepository.addAddress(user.id, body);
    if (!result.success || !result.address) {
      return NextResponse.json(
        { error: result.error || "Failed to create address." },
        { status: 400 }
      );
    }
    return NextResponse.json({ address: result.address }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Server error creating shipping address." },
      { status: 500 }
    );
  }
}
