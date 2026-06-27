import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { getProducts } from "@/lib/data/products";
import { getAllPurchases } from "@/lib/data/purchases";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { formatPrice, formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [products, purchases] = await Promise.all([
    getProducts({ includeUnpublished: true }),
    getAllPurchases(),
  ]);

  const published = products.filter((p) => p.published).length;
  const paid = purchases.filter((p) => p.status === "paid");
  const revenue = paid.reduce((sum, p) => sum + p.amountCents, 0);

  const stats = [
    { label: "Products", value: String(products.length), sub: `${published} published` },
    { label: "Purchases", value: String(paid.length), sub: "paid" },
    { label: "Revenue", value: formatPrice(revenue), sub: "all time" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">Overview</h1>
          <p className="mt-1 font-sans text-sm text-silver-300">
            Manage your catalogue, orders and content.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 border border-ivory bg-ivory px-4 py-2.5 font-sans text-[0.7rem] uppercase tracking-widest text-ink transition-colors hover:bg-white"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      {!isSupabaseAdminConfigured ? (
        <div className="mb-8 rounded-sm border border-white/15 bg-white/[0.03] p-4 font-sans text-xs leading-relaxed text-silver-300">
          <span className="uppercase tracking-widest text-ivory">Demo data</span> — Supabase
          admin isn’t configured, so figures reflect placeholder content and edits won’t persist.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-sm border border-white/10 bg-white/[0.02] p-6">
            <p className="kicker normal-case tracking-wider text-silver-400">{s.label}</p>
            <p className="mt-3 font-serif text-4xl text-ivory">{s.value}</p>
            <p className="mt-1 font-sans text-xs text-silver-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ivory">Recent purchases</h2>
          <Link href="/admin/purchases" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-silver-300 hover:text-ivory">
            All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {paid.length === 0 ? (
          <p className="rounded-sm border border-white/10 bg-white/[0.02] p-6 font-sans text-sm text-silver-400">
            No purchases yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-sm border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] text-[0.65rem] uppercase tracking-widest text-silver-400">
                <tr>
                  <th className="px-4 py-3 font-normal">Score</th>
                  <th className="px-4 py-3 font-normal">Email</th>
                  <th className="px-4 py-3 font-normal">Amount</th>
                  <th className="px-4 py-3 font-normal">Date</th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm text-silver-200">
                {paid.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-ivory">{p.productTitle ?? "—"}</td>
                    <td className="px-4 py-3">{p.customerEmail}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPrice(p.amountCents, p.currency)}</td>
                    <td className="px-4 py-3 text-silver-400">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
