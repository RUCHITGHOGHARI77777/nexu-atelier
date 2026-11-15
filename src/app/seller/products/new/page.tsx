import React from "react";
import { SupplierProductCreationWizard } from "@/components/seller/SupplierProductCreationWizard";

export const metadata = {
  title: "New Product Listing & Cost Calculator | NEXU Atelier Studio",
  description: "Create and publish artisanal products with live GST scenarios, comprehensive cost inputs, and automated profit/loss calculation.",
};

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 px-4 sm:px-6 lg:px-8">
      <SupplierProductCreationWizard />
    </div>
  );
}
