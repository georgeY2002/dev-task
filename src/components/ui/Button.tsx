"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md";

export type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  asChild?: boolean;
  loading?: boolean;
};

export function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading = false,
  children,
  ...props
}: ButtonProps) {
  if (asChild && loading) {
    throw new Error("Button cannot use loading together with asChild.");
  }

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:pointer-events-none disabled:opacity-50";

  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 min-h-9 px-3 text-sm",
    md: "h-10 min-h-10 px-4 text-sm"
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 ring-1 ring-slate-200"
  };

  const classes = cn(base, sizes[size], variants[variant], className);

  if (asChild) {
    if (!React.isValidElement(children)) {
      throw new Error(
        "Button with asChild expects a single React element child."
      );
    }
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className)
    });
  }

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={Boolean(disabled || loading)}
      aria-busy={loading || undefined}
      className={classes}
    >
      {loading ? (
        <>
          <Spinner
            className={variant === "primary" ? "text-white" : "text-slate-700"}
          />
          <span className="opacity-80">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
