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
      bg: "bg-zinc-900/90 border-zinc-800 text-zinc-300",
      icon: <Info className="w-4 h-4 text-zinc-400 shrink-0" />,
      titleColor: "text-zinc-100",
    },
    success: {
      bg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      titleColor: "text-emerald-200",
    },
    warning: {
      bg: "bg-amber-950/40 border-amber-500/30 text-amber-300",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      titleColor: "text-amber-200",
    },
    error: {
      bg: "bg-rose-950/40 border-rose-500/30 text-rose-300",
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      titleColor: "text-rose-200",
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
