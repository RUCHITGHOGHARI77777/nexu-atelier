import { NextResponse } from "next/server";
import { sitemapService } from "@/lib/server/sitemap-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await sitemapService.generateImageSitemapXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error generating image sitemap", { status: 500 });
  }
}
