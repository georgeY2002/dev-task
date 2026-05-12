"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

const LEVELS = [1, 2, 3, 4, 5] as const;

export type RatingInputProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
};

export function RatingInput({
  value,
  onChange,
  disabled = false,
  loading = false,
  className,
  label = "Rating"
}: RatingInputProps) {
  const isDisabled = disabled || loading;

  return (
    <fieldset
      className={cn("flex flex-col gap-2 border-0 p-0", className)}
      aria-busy={loading || undefined}
    >
      <legend className="sr-only">{label}</legend>
      <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <span aria-hidden>{label}</span>
        {loading ? (
          <>
            <span className="sr-only">Loading</span>
            <Spinner className="text-slate-600" />
          </>
        ) : null}
      </span>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
        {LEVELS.map((level) => {
          const selected = value !== null && level <= value;
          return (
            <Button
              key={level}
              type="button"
              variant={selected ? "primary" : "secondary"}
              size="sm"
              disabled={isDisabled}
              aria-pressed={selected}
              aria-label={`${level} out of 5`}
              onClick={() => onChange(level)}
            >
              {level}★
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
