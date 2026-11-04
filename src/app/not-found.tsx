import React from "react";
import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
          <PackageSearch className="w-8 h-8 stroke-1" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest block font-medium">
            404 • ARCHIVE ERROR
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The studio collection or piece you are seeking does not exist in the active catalog, or may have been archived by the maker workshop.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            href="/catalog"
            className="flex items-center gap-2 bg-slate-950 text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Button>

          <Button variant="outline" size="md" href="/" className="bg-white border-slate-200 text-slate-800 hover:bg-slate-50">
            Storefront Home
          </Button>
        </div>
      </div>
    </div>
  );
}
