import React, { InputHTMLAttributes, forwardRef, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#171717] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-white text-sm text-[#111111] placeholder-[#888888] rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                : "border-[#E7E7E7] hover:border-[#CCCCCC] focus:border-[#111111] focus:ring-[#111111]/15"
            } ${startIcon ? "pl-9" : "pl-3.5"} ${endIcon ? "pr-9" : "pr-3.5"} py-2 h-11 ${className}`}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 text-slate-400 flex items-center">
              {endIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
