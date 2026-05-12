import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, id, label, hint, error, disabled, ...props },
    ref
  ) {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const describedBy =
      [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-900"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/25",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error && "border-red-500 focus-visible:ring-red-200"
          )}
          {...props}
        />
        {hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
