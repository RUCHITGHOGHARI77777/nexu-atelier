import React, { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
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
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B78B45]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-white hover:bg-[#FAFAF8] text-[#171717] hover:text-[#B78B45] border-1.5 border-[#171717] hover:border-[#B78B45] shadow-xs font-semibold",
      secondary:
        "bg-[#FAFAF8] hover:bg-[#F5F6F4] text-[#171717] border border-[#E8E8E4] hover:border-[#D4D4CF] shadow-xs",
      outline:
        "bg-white hover:bg-[#FAFAF8] text-[#171717] border border-[#E8E8E4] hover:border-[#171717] shadow-xs",
      ghost:
        "bg-transparent hover:bg-[#F5F6F4] text-[#626262] hover:text-[#171717]",
      destructive:
        "bg-[#FDF2E9] hover:bg-rose-100 text-[#C2410C] border border-[#C2410C]/40 font-semibold shadow-xs",
      accent:
        "bg-[#F8F2E6] hover:bg-[#F3E8D2] text-[#8A631E] border border-[#B78B45]/50 hover:border-[#B78B45] font-semibold shadow-xs",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2 gap-2 h-10",
      lg: "text-base px-6 py-2.5 gap-2.5 h-12",
      icon: "w-10 h-10 p-0 flex items-center justify-center",
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

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
