"use client";

import React, { useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { AdminCommandCenterSaaS } from "@/components/admin/AdminCommandCenterSaaS";

export default function AdminPage() {
  const { setActiveRole } = useStore();

  useEffect(() => {
    setActiveRole("admin");
  }, [setActiveRole]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      <AdminCommandCenterSaaS />
    </div>
  );
}
