"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

// Verified reliable studio placeholder image (neutral minimal studio product)
const DEFAULT_STUDIO_FALLBACK =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

export interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_STUDIO_FALLBACK,
  className = "",
  onError,
  ...rest
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    typeof src === "string" && src.trim() ? src : fallbackSrc
  );
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state if prop changes
  useEffect(() => {
    if (typeof src === "string" && src.trim()) {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoading(true);
    } else {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoading(false);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      if (onError) onError(e);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse z-0 pointer-events-none" />
      )}
      <Image
        {...rest}
        src={currentSrc}
        alt={hasError ? "Product studio view" : alt || "Product image"}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  );
}
