import { NextResponse } from "next/server";
import { merchantFeedService } from "@/lib/server/merchant-feed-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await merchantFeedService.generateGoogleMerchantXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>${err.message || "Failed to generate Merchant Feed"}</error>`,
      { status: 500, headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }
}
