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
    neutral: "bg-zinc-800 text-zinc-300 border border-zinc-700/60",
    outline: "bg-transparent text-zinc-300 border border-zinc-700",
    success: "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30",
    warning: "bg-amber-950/60 text-amber-300 border border-amber-500/30",
    accent: "bg-indigo-950/60 text-indigo-300 border border-indigo-500/30",
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
