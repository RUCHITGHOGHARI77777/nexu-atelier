import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "outline" | "success" | "warning" | "accent";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "neutral",
  size = "md",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full tracking-wide transition-colors select-none";

  const variantStyles = {
    neutral: "bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4]",
    outline: "bg-white text-[#171717] border border-[#E8E8E4]",
    success: "bg-[#EAF6F0] text-[#21866F] border border-[#21866F]/30",
    warning: "bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/40",
    accent: "bg-[#F8F2E6] text-[#8A631E] border border-[#B78B45]/50",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-mono",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
