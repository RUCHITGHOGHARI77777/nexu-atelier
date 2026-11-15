import { NextResponse } from "next/server";
import { sitemapService } from "@/lib/server/sitemap-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await sitemapService.generateCategoriesSitemapXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error generating categories sitemap", { status: 500 });
  }
}
