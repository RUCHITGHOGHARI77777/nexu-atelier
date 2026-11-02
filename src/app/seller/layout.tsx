"use client";

import React from "react";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50/50">{children}</div>;
}
