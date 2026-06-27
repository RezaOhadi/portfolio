import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { getProducts } from "@/lib/data/products";
import { deleteProduct, togglePublish } from "./actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { formatPrice } from "@/lib/utils";
import { isSupabaseAdminConfigured } from "@/lib/env";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const products = await getProducts({ includeUnpublished: true });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">Products</h1>
          <p className="mt-1 font-sans text-sm text-silver-300">{products.length} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 border border-ivory bg-ivory px-4 py-2.5 font-sans text-[0.7rem] uppercase tracking-widest text-ink transition-colors hover:bg-white"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      {saved ? (
        <p className="mb-6 flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-sm text-ivory">
          <CheckCircle2 className="h-4 w-4" /> Product saved.
        </p>
      ) : null}

      {!isSupabaseAdminConfigured ? (
        <p className="mb-6 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Showing placeholder catalogue. Configure Supabase to manage real products.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-sm border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/[0.03] text-[0.65rem] uppercase tracking-widest text-silver-400">
            <tr>
              <th className="px-4 py-3 font-normal">Score</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="hidden px-4 py-3 font-normal sm:table-cell">Difficulty</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="font-sans text-sm text-silver-200">
            {products.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-charcoal-900 ring-1 ring-white/10">
                      <Image src={p.coverImage} alt="" fill sizes="36px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-ivory">{p.title}</p>
                      <p className="truncate text-xs text-silver-400">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(p.priceCents, p.currency)}</td>
                <td className="hidden px-4 py-3 sm:table-cell">{p.difficulty}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.published
                        ? "rounded-full bg-ivory/15 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-ivory"
                        : "rounded-full bg-white/5 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-silver-400"
                    }
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <form action={togglePublish}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="published" value={String(p.published)} />
                      <button
                        type="submit"
                        aria-label={p.published ? "Unpublish" : "Publish"}
                        className="text-silver-400 transition-colors hover:text-ivory"
                      >
                        {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </form>
                    <Link
                      href={`/admin/products/${p.id}`}
                      aria-label="Edit"
                      className="text-silver-400 transition-colors hover:text-ivory"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton
                        aria-label="Delete"
                        message={`Delete "${p.title}"? This cannot be undone.`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
