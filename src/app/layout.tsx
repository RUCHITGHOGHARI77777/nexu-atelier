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
  title: "Nexu Atelier — Luxury Artisan Marketplace",
  description:
    "An architectural multi-vendor marketplace connecting verified independent craft studios, master textile weavers, and acoustic engineers directly with global patrons.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
