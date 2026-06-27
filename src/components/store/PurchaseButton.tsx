"use client";

import { useState } from "react";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

/**
 * Initiates Stripe Checkout. Posts the product slug to /api/checkout and
 * redirects to the returned hosted-checkout URL. Gracefully disabled in demo
 * mode (no Stripe keys).
 */
export function PurchaseButton({
  slug,
  priceCents,
  currency,
  enabled,
}: {
  slug: string;
  priceCents: number;
  currency: string;
  enabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function purchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={purchase}
          disabled={!enabled || loading}
          className="group inline-flex items-center justify-center gap-2.5 border border-ivory bg-ivory px-8 py-4 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" /> Purchase Score
            </>
          )}
        </button>
        <span className="font-serif text-3xl text-ivory">
          {formatPrice(priceCents, currency)}
        </span>
      </div>

      {!enabled ? (
        <p className="font-sans text-xs leading-relaxed text-silver-400">
          Checkout is disabled in demo mode. Add Stripe credentials to enable secure purchases.
        </p>
      ) : (
        <p className="flex items-center gap-1.5 font-sans text-xs text-silver-400">
          <Lock className="h-3 w-3" /> Secure checkout via Stripe · instant PDF delivery
        </p>
      )}

      {error ? (
        <p className="flex items-center gap-1.5 font-sans text-xs text-ivory">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}
    </div>
  );
}
