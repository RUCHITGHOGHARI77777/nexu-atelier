"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Sparkles } from "lucide-react";

export interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackAlt?: string;
  fallbackSrc?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackAlt = "Nexu Atelier Curated Piece",
  fallbackSrc,
  className = "",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const isValidSrc = Boolean(currentSrc && typeof currentSrc === "string" && currentSrc.trim().length > 0);

  if (hasError || !isValidSrc) {
    if (fallbackSrc && !hasError) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt || fallbackAlt}
          className={className}
          onError={() => setHasError(true)}
          {...props}
        />
      );
    }

    return (
      <div
        className={`w-full h-full min-h-[140px] bg-stone-100 flex flex-col items-center justify-center text-stone-500 border border-stone-200/60 p-4 transition-all duration-300 ${className}`}
        role="img"
        aria-label={alt || fallbackAlt}
      >
        <Sparkles className="w-6 h-6 stroke-1 text-stone-400 mb-2 animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 text-center font-medium line-clamp-1 px-2">
          {alt || "Nexu Atelier"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt || fallbackAlt}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setHasError(true);
        }
      }}
      {...props}
    />
  );
};
