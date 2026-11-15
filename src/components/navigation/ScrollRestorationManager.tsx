"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ScrollRestorationEngine } from "@/lib/navigation/scrollRestoration";

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cleanup = ScrollRestorationEngine.init();
    return cleanup;
  }, []);

  useEffect(() => {
    const search = searchParams ? searchParams.toString() : "";
    const queryString = search ? `?${search}` : "";
    ScrollRestorationEngine.handleRouteChange(pathname, queryString);
  }, [pathname, searchParams]);

  return null;
}

export function ScrollRestorationManager() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  );
}
