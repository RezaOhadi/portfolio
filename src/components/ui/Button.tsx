import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 font-sans uppercase tracking-widest text-[0.72rem] transition-all duration-500 ease-cinematic focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ivory text-ink hover:bg-white border border-ivory hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(242,238,230,0.35)]",
  outline:
    "border border-white/25 text-ivory hover:border-ivory hover:bg-white/5 hover:-translate-y-0.5",
  ghost: "text-silver-300 hover:text-ivory",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3.5",
  lg: "px-8 py-4",
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** When provided, renders an anchor/Link instead of a button. */
  href?: string;
  newTab?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  name?: string;
  value?: string;
  title?: string;
  "aria-label"?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  newTab,
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);

  if (href) {
    const external = href.startsWith("http") || newTab;
    if (external) {
      return (
        <a
          href={href}
          className={cls}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={rest["aria-label"]}
          title={rest.title}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} aria-label={rest["aria-label"]} title={rest.title}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
