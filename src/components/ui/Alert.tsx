import React, { HTMLAttributes, ReactNode } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  icon?: ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  className = "",
  variant = "info",
  title,
  icon,
  children,
  ...props
}) => {
  const styles = {
    info: {
      bg: "bg-[#FAFAF8] border-[#E8E8E4] text-[#171717]",
      icon: <Info className="w-4 h-4 text-[#626262] shrink-0" />,
      titleColor: "text-[#171717]",
    },
    success: {
      bg: "bg-[#EAF6F0] border-[#21866F]/30 text-[#21866F]",
      icon: <CheckCircle2 className="w-4 h-4 text-[#21866F] shrink-0" />,
      titleColor: "text-[#15803D]",
    },
    warning: {
      bg: "bg-[#F8F2E6] border-[#B78B45]/40 text-[#8A631E]",
      icon: <AlertTriangle className="w-4 h-4 text-[#B78B45] shrink-0" />,
      titleColor: "text-[#8A631E]",
    },
    error: {
      bg: "bg-[#FDF2E9] border-[#C2410C]/30 text-[#C2410C]",
      icon: <AlertCircle className="w-4 h-4 text-[#C2410C] shrink-0" />,
      titleColor: "text-[#9A3412]",
    },
  };

  const selected = styles[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 backdrop-blur-sm ${selected.bg} ${className}`}
      {...props}
    >
      {icon || selected.icon}
      <div className="flex-1 space-y-0.5">
        {title && <h5 className={`font-semibold ${selected.titleColor}`}>{title}</h5>}
        <div className="text-current opacity-90">{children}</div>
      </div>
    </div>
  );
};
