"use client";
import {
  useEffect,
  useRef,
  type ElementType,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { Variants } from "framer-motion";
interface RevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  amount?: number;
  as?: ElementType;
  once?: boolean;
}
/** Visible in SSR and without JavaScript; motion is only progressive enhancement. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  amount = 0.15,
  as: Tag = "div",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches || !("IntersectionObserver" in window))
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.revealed = "true";
          if (once) observer.disconnect();
        } else if (!once) delete node.dataset.revealed;
      },
      { threshold: Math.min(amount, 0.3) },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, once]);
  return (
    <Tag
      ref={ref}
      className={"scroll-reveal " + className}
      style={{ "--reveal-delay": delay + "s" } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
export function Stagger({
  children,
  className,
  as = "div",
  amount,
  once,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  as?: ElementType;
  once?: boolean;
}) {
  return (
    <Reveal className={className} as={as} amount={amount} once={once}>
      {children}
    </Reveal>
  );
}
export function StaggerItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={className}>{children}</Tag>;
}
