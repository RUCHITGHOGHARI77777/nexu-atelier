import { NextRequest, NextResponse } from "next/server";
import { shippingService } from "@/lib/server/shipping/shipping-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid 6-digit Indian postal PIN code." },
        { status: 400 }
      );
    }

    const result = await shippingService.checkServiceability(pincode.trim());

    return NextResponse.json({
      success: true,
      serviceability: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check PIN code delivery serviceability." },
      { status: 500 }
    );
  }
}
