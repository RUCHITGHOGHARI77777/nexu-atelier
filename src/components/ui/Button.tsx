import React, { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "text" | "destructive" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  href?: string;
  target?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      href,
      target,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-[#111111] hover:bg-[#222222] text-white border border-[#111111] shadow-xs font-semibold",
      secondary:
        "bg-white hover:bg-[#F7F7F7] text-[#111111] border border-[#E7E7E7] hover:border-[#111111] shadow-xs font-semibold",
      outline:
        "bg-transparent hover:bg-[#F7F7F7] text-[#111111] border border-[#E7E7E7] hover:border-[#111111] shadow-xs font-semibold",
      ghost:
        "bg-transparent hover:bg-[#F7F7F7] text-[#666666] hover:text-[#111111] font-medium",
      text:
        "bg-transparent hover:bg-[#F7F7F7] text-[#666666] hover:text-[#111111] font-medium",
      destructive:
        "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-600 font-semibold shadow-xs",
      accent:
        "bg-[#B78B45] hover:bg-[#A37838] text-white border border-[#B78B45] font-semibold shadow-xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-1.5 gap-1.5 h-9",
      md: "text-sm px-5 py-2.5 gap-2 h-11",
      lg: "text-base px-7 py-3.5 gap-2.5 h-12",
      icon: "w-10 h-10 min-w-[40px] min-h-[40px] p-0 flex items-center justify-center rounded-xl",
    };

    const resolvedVariant = variantStyles[variant] || variantStyles.primary;
    const combinedClassName = cn(baseStyles, resolvedVariant, sizeStyles[size], className);

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          className={combinedClassName}
          onClick={props.onClick as any}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
