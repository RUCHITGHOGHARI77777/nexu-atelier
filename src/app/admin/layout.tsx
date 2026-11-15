"use client";

import React from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <Breadcrumbs />
      </div>
      {children}
    </div>
  );
}
