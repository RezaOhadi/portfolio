"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Difficulty, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

type Sort = "newest" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
];

export function StoreGrid({ products }: { products: Product[] }) {
  const difficulties = useMemo(() => {
    const set = new Set<Difficulty>(products.map((p) => p.difficulty));
    return ["All", ...Array.from(set)] as const;
  }, [products]);

  const [difficulty, setDifficulty] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("newest");

  const visible = useMemo(() => {
    let list = products;
    if (difficulty !== "All") list = list.filter((p) => p.difficulty === difficulty);
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      if (sort === "price-desc") return b.priceCents - a.priceCents;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [products, difficulty, sort]);

  return (
    <div>
      <div className="mb-12 flex flex-col gap-5 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by difficulty" className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              className={cn(
                "rounded-full border px-4 py-2 text-[0.7rem] uppercase tracking-widest transition-colors duration-300",
                difficulty === d
                  ? "border-ivory bg-ivory text-ink"
                  : "border-white/15 text-silver-300 hover:border-white/40 hover:text-ivory",
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3">
          <span className="kicker shrink-0 normal-case tracking-wider text-silver-400">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border-0 border-b border-white/20 bg-transparent py-1.5 font-sans text-sm text-ivory focus:border-ivory focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-ink text-ivory">
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center font-serif text-2xl text-silver-300">
          No scores match this filter yet.
        </p>
      ) : (
        <motion.div layout className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProductCard product={product} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
