import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "neutral";

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-slate-900",
  neutral: "bg-slate-100 text-slate-800 ring-1 ring-slate-200"
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
