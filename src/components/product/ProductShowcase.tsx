"use client";

import React, { useState } from "react";
import { Product, ColorVariant } from "@/types/marketplace";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";

export interface ProductShowcaseProps {
  product: Product;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ product }) => {
  const [selectedColorImage, setSelectedColorImage] = useState<string | undefined>(
    product.availableColors?.[0]?.image || product.images[0]
  );

  const handleColorChange = (color: ColorVariant) => {
    if (color.image) {
      setSelectedColorImage(color.image);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Left: Gallery with Lightbox & Magnification */}
      <div className="lg:col-span-7">
        <ProductGallery
          images={product.images}
          title={product.title}
          selectedColorImage={selectedColorImage}
        />
      </div>

      {/* Right: Info & Purchase Controls */}
      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <ProductInfo product={product} onColorChange={handleColorChange} />
      </div>
    </div>
  );
};
