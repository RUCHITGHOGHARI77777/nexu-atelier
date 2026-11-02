import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { StoreProvider } from "@/context/StoreContext";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { NavbarSaaS } from "@/components/layout/NavbarSaaS";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartDrawerSaaS } from "@/components/cart/CartDrawerSaaS";
import { ProductQuickViewModal } from "@/components/storefront/ProductQuickViewModal";
import { B2BQuoteModal } from "@/components/storefront/B2BQuoteModal";
import { EvaluatorDemoControlBar } from "@/components/demo/EvaluatorDemoControlBar";
import { LiquidGlassToastStack } from "@/components/ui/LiquidGlassToastStack";
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
      <body className="bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 min-h-screen flex flex-col font-sans relative">
        {/* Persistent Liquid Water-Glass Ambient Light Engine */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Top-Left Ice Blue Ambient Blob */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-transparent blur-3xl animate-blob-1" />
          {/* Top-Right Silver-Pearl Ambient Blob */}
          <div className="absolute top-20 -right-40 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-slate-200/50 via-indigo-50/30 to-transparent blur-3xl animate-blob-2" />
          {/* Center-Bottom Soft Aqua Water Highlight */}
          <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-gradient-to-t from-emerald-100/30 via-teal-50/20 to-transparent blur-3xl animate-blob-3" />
        </div>

        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <RecentlyViewedProvider>
                    <StoreProvider>
                      {/* Architectural enterprise header with Role Switcher & Live Search */}
                      <NavbarSaaS />

                      {/* Main content body */}
                      <main className="flex-1">{children}</main>

                      {/* Enterprise Slide-Over Cart Drawer & Quick-View Modal */}
                      <CartDrawerSaaS />
                      <ProductQuickViewModal />
                      <B2BQuoteModal />

                      {/* Ultra-Premium Liquid Glass Multi-Toast Notification Stack */}
                      <LiquidGlassToastStack />

                      {/* Floating Evaluator 1-Click Demo Simulator Control Bar */}
                      <EvaluatorDemoControlBar />

                      {/* Floating comparison bar */}
                      <FloatingCompareBar />

                      {/* PWA offline service worker */}
                      <ServiceWorkerRegister />

                      {/* Comprehensive footer */}
                      <Footer />
                    </StoreProvider>
                  </RecentlyViewedProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
