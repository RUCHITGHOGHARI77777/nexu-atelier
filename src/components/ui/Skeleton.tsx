import React, { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-800/80 ${className}`}
      {...props}
    />
  );
};
