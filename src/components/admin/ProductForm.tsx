"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/app/admin/(dashboard)/products/actions";
import { DIFFICULTIES, type Product } from "@/lib/types";

const initial: ProductFormState = { status: "idle" };

const inputCls =
  "w-full rounded-sm border border-white/15 bg-ink-deep px-3 py-2.5 font-sans text-sm text-ivory placeholder:text-silver-400/50 focus:border-ivory focus:outline-none";
const labelCls = "mb-1.5 block font-sans text-xs uppercase tracking-widest text-silver-400";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 border border-ivory bg-ivory px-6 py-3 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-colors hover:bg-white disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving…" : "Save product"}
    </button>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction] = useActionState(saveProduct, initial);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="existing_cover" value={product?.coverImage ?? ""} />
      <input type="hidden" name="existing_pdf" value={product?.pdfPath ?? ""} />
      <input
        type="hidden"
        name="existing_previews"
        value={JSON.stringify(product?.previewImages ?? [])}
      />

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *">
            <input name="title" required defaultValue={product?.title} className={inputCls} />
          </Field>
          <Field label="Slug (auto from title if blank)">
            <input name="slug" defaultValue={product?.slug} placeholder="nocturne-in-ash" className={inputCls} />
          </Field>
          <Field label="Composer">
            <input name="composer" defaultValue={product?.composer ?? "Reza Ohadi"} className={inputCls} />
          </Field>
          <Field label="Genre">
            <input name="genre" defaultValue={product?.genre} placeholder="Contemporary Classical" className={inputCls} />
          </Field>
        </div>
        <Field label="Short description">
          <textarea name="short_description" rows={2} defaultValue={product?.shortDescription} className={inputCls} />
        </Field>
        <Field label="Long description / program note">
          <textarea name="long_description" rows={5} defaultValue={product?.longDescription} className={inputCls} />
        </Field>
      </Section>

      <Section title="Details & pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (e.g. 9.99)">
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
              className={inputCls}
            />
          </Field>
          <Field label="Currency">
            <input name="currency" defaultValue={product?.currency ?? "usd"} className={inputCls} />
          </Field>
          <Field label="Difficulty">
            <select name="difficulty" defaultValue={product?.difficulty ?? "Intermediate"} className={inputCls}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="bg-ink">
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Instrument">
            <input name="instrument" defaultValue={product?.instrument ?? "Solo Piano"} className={inputCls} />
          </Field>
          <Field label="Mood">
            <input name="mood" defaultValue={product?.mood} placeholder="Introspective · Nocturnal" className={inputCls} />
          </Field>
          <Field label="Pages">
            <input name="pages" type="number" min="0" defaultValue={product?.pages || ""} className={inputCls} />
          </Field>
          <Field label="Duration (seconds)">
            <input name="duration" type="number" min="0" defaultValue={product?.durationSeconds || ""} className={inputCls} />
          </Field>
          <Field label="Related slugs (comma-separated)">
            <input name="related" defaultValue={product?.relatedSlugs.join(", ")} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Links">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Audio preview URL">
            <input name="audio_preview_url" defaultValue={product?.audioPreviewUrl ?? ""} placeholder="https://…" className={inputCls} />
          </Field>
          <Field label="YouTube URL">
            <input name="youtube_url" defaultValue={product?.youtubeUrl ?? ""} placeholder="https://youtube.com/…" className={inputCls} />
          </Field>
          <Field label="Instagram URL">
            <input name="instagram_url" defaultValue={product?.instagramUrl ?? ""} placeholder="https://instagram.com/…" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Files">
        <p className="-mt-2 mb-2 font-sans text-xs text-silver-400">
          Leave a file blank to keep the current one. Uploading preview pages replaces the existing set.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Cover image">
            {product?.coverImage ? (
              <div className="relative mb-2 aspect-[3/4] w-20 overflow-hidden rounded-sm ring-1 ring-white/10">
                <Image src={product.coverImage} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ) : null}
            <input name="cover" type="file" accept="image/*" className={inputCls} />
          </Field>
          <Field label="Preview pages (multiple)">
            <input name="previews" type="file" accept="image/*" multiple className={inputCls} />
            {product?.previewImages.length ? (
              <p className="mt-1 font-sans text-xs text-silver-400">
                {product.previewImages.length} current page(s).
              </p>
            ) : null}
          </Field>
          <Field label="Original PDF (private)">
            <input name="pdf" type="file" accept="application/pdf" className={inputCls} />
            {product?.pdfPath ? (
              <p className="mt-1 font-sans text-xs text-silver-400">PDF on file ✓</p>
            ) : (
              <p className="mt-1 font-sans text-xs text-silver-400">No PDF yet.</p>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Visibility">
        <div className="flex flex-wrap gap-8">
          <label className="flex items-center gap-3 font-sans text-sm text-ivory">
            <input type="checkbox" name="published" defaultChecked={product?.published} className="h-4 w-4 accent-ivory" />
            Published (visible in store)
          </label>
          <label className="flex items-center gap-3 font-sans text-sm text-ivory">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-ivory" />
            Featured on home
          </label>
        </div>
      </Section>

      {state.status === "error" ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ivory">
          <AlertCircle className="h-4 w-4" /> {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <SaveButton />
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
      <legend className="px-2 font-serif text-lg text-ivory">{title}</legend>
      <div className="flex flex-col gap-4 pt-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}
