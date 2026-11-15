import type { Metadata } from "next";
import { Manrope, Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { StoreProvider } from "@/context/StoreContext";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { AppFooter } from "@/components/layout/AppFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ProductQuickViewModal } from "@/components/storefront/ProductQuickViewModal";
import { B2BQuoteModal } from "@/components/storefront/B2BQuoteModal";
import { EvaluatorDemoControlBar } from "@/components/demo/EvaluatorDemoControlBar";
import { FloatingPhoneSimulator } from "@/components/demo/FloatingPhoneSimulator";
import { LiquidGlassToastStack } from "@/components/ui/LiquidGlassToastStack";
import { FloatingCompareBar } from "@/components/compare/FloatingCompareBar";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { ScrollRestorationManager } from "@/components/navigation/ScrollRestorationManager";

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
      <body className={`${manrope.variable} ${inter.variable} ${dmSerifDisplay.variable} bg-white text-[#111111] antialiased selection:bg-[#111111] selection:text-white min-h-screen flex flex-col font-sans relative`}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <RecentlyViewedProvider>
                    <StoreProvider>
                      <ScrollRestorationManager />
                      <AppNavigation />

                      <main className="flex-1">{children}</main>

                      <CartDrawer />
                      <ProductQuickViewModal />
                      <B2BQuoteModal />

                      <LiquidGlassToastStack />

                      <EvaluatorDemoControlBar />

                      <FloatingPhoneSimulator />

                      <FloatingCompareBar />

                      <ServiceWorkerRegister />

                      <AppFooter />
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
