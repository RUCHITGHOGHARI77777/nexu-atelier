import { NextResponse } from "next/server";
import { sitemapService } from "@/lib/server/sitemap-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = sitemapService.generatePagesSitemapXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=7200, s-maxage=86400",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error generating pages sitemap", { status: 500 });
  }
}
