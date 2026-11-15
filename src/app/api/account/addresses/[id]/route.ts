import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { addressRepository } from "@/lib/server/address-repository";

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await addressRepository.updateAddress(user.id, params.id, body);
    if (!result.success || !result.address) {
      return NextResponse.json(
        { error: result.error || "Failed to update address." },
        { status: 400 }
      );
    }
    return NextResponse.json({ address: result.address });
  } catch {
    return NextResponse.json(
      { error: "Server error updating shipping address." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const result = await addressRepository.deleteAddress(user.id, params.id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to delete address." },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
