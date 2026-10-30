import { NextResponse } from "next/server";
import { sitemapService } from "@/lib/server/sitemap-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await sitemapService.generateSitemapIndexXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error generating sitemap index", { status: 500 });
  }
}
