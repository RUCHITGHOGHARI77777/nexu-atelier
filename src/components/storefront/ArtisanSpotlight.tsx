import React from "react";
import Link from "next/link";
import { SEED_VENDORS } from "@/data/seedCatalog";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ArrowRight, MapPin, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ArtisanSpotlight: React.FC = () => {
  const vendor = SEED_VENDORS.solTextiles;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs p-8 sm:p-12 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Studio Profile Left */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-mono text-zinc-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>VERIFIED MAKER SPOTLIGHT</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                {vendor.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1 text-zinc-800 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {vendor.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-zinc-600">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {vendor.dispatchTime}
                </span>
                <span>•</span>
                <span className="font-mono text-zinc-900 font-bold">
                  ★ {vendor.rating} ({vendor.totalSales.toLocaleString()} orders)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-xl">
              &ldquo;{vendor.story}&rdquo;
            </p>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 max-w-xl space-y-1">
              <div className="font-bold text-zinc-950">
                Ethical Sourcing & Zero Middleman Cut:
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal">
                Orders placed for Solstice Loom Studio are routed straight to their Ring Road weaving facilities with direct courier dispatch and verified GST invoices.
              </p>
            </div>

            <div>
              <Button
                variant="primary"
                size="md"
                href="/catalog?category=Apparel"
                className="flex items-center gap-2"
              >
                <span>Explore Solstice Studio Pieces</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Visual Right */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-100">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85"
                alt="Solstice Loom Studio craft"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
