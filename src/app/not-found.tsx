import React from "react";
import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
          <PackageSearch className="w-8 h-8 stroke-1" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest block">
            404 • ARCHIVE ERROR
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The studio collection or piece you are seeking does not exist in the active catalog, or may have been archived by the maker workshop.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="md">
            <Link href="/catalog" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Catalog</span>
            </Link>
          </Button>

          <Button variant="outline" size="md">
            <Link href="/">Storefront Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
