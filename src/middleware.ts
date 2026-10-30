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

  // 3. Response Construction & Defensive Security Headers
  const response = NextResponse.next();

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
