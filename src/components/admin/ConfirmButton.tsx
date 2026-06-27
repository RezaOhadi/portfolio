"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Submit button that asks for confirmation before submitting its form. */
export function ConfirmButton({
  children,
  message = "Are you sure?",
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  message?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-silver-400 transition-colors hover:text-ivory",
        className,
      )}
    >
      {children}
    </button>
  );
}
