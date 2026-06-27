import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { getSiteContent } from "@/lib/data/content";
import { getProducts } from "@/lib/data/products";
import { getGalleryImages } from "@/lib/data/gallery";
import { SocialForm, HomeForm, BioForm } from "@/components/admin/ContentForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { addGalleryImage, deleteGalleryImage } from "./actions";
import { isSupabaseAdminConfigured } from "@/lib/env";

const input =
  "w-full rounded-sm border border-white/15 bg-ink-deep px-3 py-2.5 font-sans text-sm text-ivory placeholder:text-silver-400/50 focus:border-ivory focus:outline-none";
const label = "mb-1.5 block font-sans text-xs uppercase tracking-widest text-silver-400";

export default async function AdminContentPage() {
  const [content, products, gallery] = await Promise.all([
    getSiteContent(),
    getProducts({ includeUnpublished: true }),
    getGalleryImages(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ivory">Content</h1>
      <p className="mb-8 mt-1 font-sans text-sm text-silver-300">
        Manage social links, the home page, biography and gallery.
      </p>

      {!isSupabaseAdminConfigured ? (
        <p className="mb-6 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Configure Supabase to persist content changes. (Edits won’t save in demo mode.)
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        <SocialForm social={content.social} />
        <HomeForm
          home={content.home}
          products={products.map((p) => ({ slug: p.slug, title: p.title }))}
        />
        <BioForm bio={content.bio} />

        {/* Gallery manager */}
        <section className="rounded-sm border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-5 font-serif text-xl text-ivory">Gallery</h2>

          {gallery.length ? (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {gallery.map((img) => (
                <div key={img.id} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-charcoal-900 ring-1 ring-white/10">
                  <Image src={img.imageUrl} alt={img.caption ?? ""} fill sizes="120px" className="object-cover" />
                  <form action={deleteGalleryImage} className="absolute right-1.5 top-1.5">
                    <input type="hidden" name="id" value={img.id} />
                    <ConfirmButton
                      aria-label="Delete image"
                      message="Delete this image?"
                      className="rounded-full bg-ink/70 p-1.5 text-ivory backdrop-blur"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          ) : null}

          <form action={addGalleryImage} className="flex flex-col gap-4 border-t border-white/10 pt-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-silver-400">Add image</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Image file</span>
                <input name="image" type="file" accept="image/*" required className={input} />
              </label>
              <label className="block">
                <span className={label}>Caption</span>
                <input name="caption" className={input} />
              </label>
              <label className="block">
                <span className={label}>Location</span>
                <input name="location" className={input} />
              </label>
              <label className="block">
                <span className={label}>Event date</span>
                <input name="event_date" type="date" className={input} />
              </label>
              <label className="block">
                <span className={label}>Sort order</span>
                <input name="sort_order" type="number" defaultValue={gallery.length + 1} className={input} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={label}>Width</span>
                  <input name="width" type="number" defaultValue={1000} className={input} />
                </label>
                <label className="block">
                  <span className={label}>Height</span>
                  <input name="height" type="number" defaultValue={1250} className={input} />
                </label>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 border border-ivory bg-ivory px-5 py-2.5 font-sans text-[0.7rem] uppercase tracking-widest text-ink transition-colors hover:bg-white"
              >
                <Plus className="h-4 w-4" /> Add image
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
