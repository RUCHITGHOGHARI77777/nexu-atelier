"use client";

import React, { useState, useEffect, useRef } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductGalleryProps {
  images: string[];
  title: string;
  selectedColorImage?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  title,
  selectedColorImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(
    selectedColorImage || images[0]
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // If selectedColorImage changes from external color swatch, update
  useEffect(() => {
    if (selectedColorImage) {
      setSelectedImage(selectedColorImage);
    }
  }, [selectedColorImage]);

  // If images array changes, reset to first image or color image
  useEffect(() => {
    setSelectedImage(selectedColorImage || images[0]);
  }, [images, selectedColorImage]);

  const activeImage = selectedImage || images[0];
  const currentIndex = images.indexOf(activeImage) !== -1 ? images.indexOf(activeImage) : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIdx]);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, currentIndex, images]);

  return (
    <div className="space-y-4">
      {/* Primary Showcase Image with Magnification */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
        className="group relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-sm cursor-zoom-in"
      >
        <ImageWithFallback
          src={activeImage}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 600px"
          className={`object-cover object-center transition-transform duration-200 ${
            isZoomed ? "scale-125" : "scale-100"
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
        />

        {/* Expand / Lightbox Action Icon */}
        <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur-md text-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-200 shadow-sm">
          <Maximize2 className="w-4 h-4" />
        </div>
      </div>

      {/* Thumbnail Selector Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((img, idx) => {
            const isSelected = activeImage === img;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-24 rounded-xl overflow-hidden bg-zinc-100 border-2 transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "border-amber-600 ring-2 ring-amber-500/30 scale-105 shadow-md"
                    : "border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-400"
                }`}
                aria-label={`View image ${idx + 1} of ${images.length}`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${title} - view ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 transition-colors z-10"
              aria-label="Close high-resolution viewer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left / Prev */}
            {images.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 p-2.5 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Main Modal Image */}
            <div className="relative w-full h-[80vh] rounded-xl overflow-hidden">
              <ImageWithFallback
                src={activeImage}
                alt={title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Right / Next */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2.5 p-2.5 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-2 text-xs font-mono text-zinc-400 bg-zinc-950/80 px-3 py-1 rounded-full border border-zinc-800">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
