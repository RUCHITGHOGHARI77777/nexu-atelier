import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { FloatingCompareBar } from "@/components/compare/FloatingCompareBar";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio"),
  title: {
    default: "NEXU ATELIER — Handcrafted Artisan Heritage & Modern Luxury",
    template: "%s | NEXU ATELIER",
  },
  description:
    "An architectural multi-vendor marketplace connecting verified independent craft studios, master textile weavers, and acoustic engineers directly with global patrons.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    siteName: "NEXU ATELIER",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexu.studio";

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NEXU ATELIER",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NEXU ATELIER",
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    description:
      "Curated multi-vendor architectural marketplace connecting verified independent craft studios directly with global patrons.",
    sameAs: [
      "https://instagram.com/nexuatelier",
      "https://pinterest.com/nexuatelier",
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-[#fafafa] text-zinc-900 antialiased selection:bg-amber-100 selection:text-amber-900 min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <RecentlyViewedProvider>
                  {/* Top architectural announcement strip */}
                  <AnnouncementBar />

                  {/* Persistent accessible header */}
                  <Header />

                  {/* Main content body */}
                  <main className="flex-1">{children}</main>

                  {/* Slide-over cart drawer & toast notifications */}
                  <CartDrawer />
                  <ToastNotification />

                  {/* Floating comparison bar */}
                  <FloatingCompareBar />

                  {/* PWA offline service worker */}
                  <ServiceWorkerRegister />

                  {/* Comprehensive footer */}
                  <Footer />
                </RecentlyViewedProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
