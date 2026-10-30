"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Image as ImageIcon } from "lucide-react";

export interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackAlt?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackAlt = "Product imagery placeholder",
  className = "",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`w-full h-full min-h-[140px] bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 border border-zinc-800/80 p-4 ${className}`}
        role="img"
        aria-label={alt || fallbackAlt}
      >
        <ImageIcon className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 text-center">
          {alt || "Studio Image Archive"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
