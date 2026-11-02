import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Path Traversal & Decoy Probe Interception
  if (
    pathname.includes("..") ||
    pathname.includes("%2e%2e") ||
    pathname.includes("%2E%2E") ||
    pathname.endsWith(".env") ||
    pathname.includes("/wp-admin") ||
    pathname.includes("/phpmyadmin") ||
    pathname.includes("admin.php")
  ) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Security violation detected." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. CSRF Origin Validation for State-Changing API Mutations
  // Exclude external webhooks (Razorpay / 3PL Logistics) which use HMAC SHA-256 signatures
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const isApiRoute = pathname.startsWith("/api/");
  const isWebhook = pathname.startsWith("/api/webhooks/");

  if (isStateChanging && isApiRoute && !isWebhook) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Normalize ports/hostnames
        if (originUrl.host !== host) {
          return new NextResponse(
            JSON.stringify({ error: "Cross-Site Request Forgery (CSRF) validation failed." }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Malformed request origin." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  // 3. Multi-Tenant Edge Router & Domain Resolution Layer
  // Resolves tenant identity across 3 ingress channels:
  // Channel A: Custom Domain (e.g., brandname.com)
  // Channel B: Subdomain (e.g., brandname.nexu.global or brandname.nexu.store)
  // Channel C: Path Store (e.g., nexu.global/store/brandname)
  let tenantSlug = "";
  let routingMode: "PATH_BASED" | "SUBDOMAIN" | "CUSTOM_DOMAIN" | "GLOBAL_HUB" = "GLOBAL_HUB";

  const hostHeader = request.headers.get("host") || "";
  const hostname = hostHeader.split(":")[0].toLowerCase();

  const isPlatformDomain =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "nexu.global" ||
    hostname === "nexu.store" ||
    hostname === "nexu.in" ||
    hostname.endsWith(".vercel.app");

  if (!isPlatformDomain) {
    if (
      hostname.endsWith(".nexu.global") ||
      hostname.endsWith(".nexu.store") ||
      hostname.endsWith(".nexu.in")
    ) {
      // Subdomain Mode: e.g. "jaipur-handlooms.nexu.global"
      const sub = hostname.split(".")[0];
      if (sub && sub !== "www" && sub !== "app" && sub !== "admin") {
        tenantSlug = sub;
        routingMode = "SUBDOMAIN";
      }
    } else {
      // Custom Domain Mode: e.g. "brandname.com"
      tenantSlug = hostname.replace(/\./g, "-");
      routingMode = "CUSTOM_DOMAIN";
    }
  } else if (pathname.startsWith("/store/")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[1]) {
      tenantSlug = segments[1];
      routingMode = "PATH_BASED";
    }
  }

  // Response Construction & Edge Rewrite
  let response: NextResponse;
  if ((routingMode === "SUBDOMAIN" || routingMode === "CUSTOM_DOMAIN") && pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/store/${tenantSlug}`;
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  // Inject Verified Edge Ingress Headers for Downstream Consumption
  if (tenantSlug) {
    response.headers.set("x-nexu-tenant-slug", tenantSlug);
    response.headers.set("x-nexu-routing-mode", routingMode);
  }

  // Content-Security-Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Enforce HSTS if running over HTTPS
  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt / sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
