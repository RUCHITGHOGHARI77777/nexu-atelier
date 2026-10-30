"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in dev mode
    console.error("Storefront Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-rose-400 uppercase tracking-widest block">
            CLIENT RUNTIME EXCEPTION
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            An unexpected error occurred
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The studio runtime encountered an issue rendering this view. You can try reloading or returning to the catalog archive.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>

          <Button variant="outline" size="md">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
