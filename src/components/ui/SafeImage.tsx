"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

const DEFAULT_STUDIO_FALLBACK = "/placeholder-specimen.svg";

export interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  wrapperClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_STUDIO_FALLBACK,
  className = "",
  wrapperClassName = "",
  onError,
  ...rest
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(
    typeof src === "string" && src.trim() ? src : fallbackSrc
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof src === "string" && src.trim()) {
      setCurrentSrc(src);
      setHasError(false);
    } else {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      if (onError) onError(e);
    }
  };

  return (
    <div
      className={`${
        wrapperClassName.includes("absolute") ? "" : "relative"
      } w-full h-full overflow-hidden bg-zinc-100 ${wrapperClassName}`}
    >
      <Image
        {...rest}
        src={currentSrc}
        alt={hasError ? "Product studio view" : alt || "Product image"}
        className={`${className} transition-opacity duration-300`}
        onError={handleError}
      />
    </div>
  );
}

