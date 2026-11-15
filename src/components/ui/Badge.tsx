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
    neutral: "bg-[#F7F7F7] text-[#111111] border border-[#E7E7E7]",
    outline: "bg-white text-[#111111] border border-[#E7E7E7]",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border border-amber-200",
    accent: "bg-[#111111] text-white border border-[#111111]",
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
