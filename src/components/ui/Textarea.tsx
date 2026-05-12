import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, id, label, hint, error, disabled, rows = 4, ...props },
    ref
  ) {
    const autoId = React.useId();
    const textareaId = id ?? autoId;
    const describedBy =
      [hint ? `${textareaId}-hint` : null, error ? `${textareaId}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-slate-900"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/25",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error && "border-red-500 focus-visible:ring-red-200"
          )}
          {...props}
        />
        {hint ? (
          <p id={`${textareaId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
