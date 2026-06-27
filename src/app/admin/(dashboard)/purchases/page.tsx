import { Mail, Download, CheckCircle2 } from "lucide-react";
import { getAllPurchases } from "@/lib/data/purchases";
import { resendPurchaseEmail } from "./actions";
import { formatPrice, formatDate } from "@/lib/utils";
import { isSupabaseAdminConfigured } from "@/lib/env";

export default async function AdminPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const purchases = await getAllPurchases();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ivory">Purchases</h1>
      <p className="mb-8 mt-1 font-sans text-sm text-silver-300">
        {purchases.length} order{purchases.length === 1 ? "" : "s"}
      </p>

      {sent ? (
        <p className="mb-6 flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-sm text-ivory">
          <CheckCircle2 className="h-4 w-4" /> Download email re-sent.
        </p>
      ) : null}

      {!isSupabaseAdminConfigured ? (
        <p className="rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Configure Supabase to view real orders. (No purchase data in demo mode.)
        </p>
      ) : purchases.length === 0 ? (
        <p className="rounded-sm border border-white/10 bg-white/[0.02] p-6 font-sans text-sm text-silver-400">
          No purchases yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-white/10">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-white/[0.03] text-[0.65rem] uppercase tracking-widest text-silver-400">
              <tr>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Score</th>
                <th className="px-4 py-3 font-normal">Customer</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm text-silver-200">
              {purchases.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="whitespace-nowrap px-4 py-3 text-silver-400">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-ivory">{p.productTitle ?? "—"}</td>
                  <td className="px-4 py-3">{p.customerEmail}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(p.amountCents, p.currency)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-ivory/15 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-ivory">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <a
                        href={`/api/download?token=${p.downloadToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Download file"
                        className="text-silver-400 transition-colors hover:text-ivory"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <form action={resendPurchaseEmail}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          aria-label="Re-send download email"
                          className="text-silver-400 transition-colors hover:text-ivory"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
