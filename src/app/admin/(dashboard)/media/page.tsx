import { getSiteContent } from "@/lib/data/content";
import { ListEditor } from "@/components/admin/ListEditor";
import { isSupabaseAdminConfigured } from "@/lib/env";

export default async function AdminMediaPage() {
  const content = await getSiteContent();
  const videos = content.media;
  const featured = videos.filter((v) => v.featured).length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ivory">Media</h1>
      <p className="mb-8 mt-1 font-sans text-sm text-silver-300">
        {videos.length} video{videos.length === 1 ? "" : "s"} · {featured} featured on the home page.
        The Media page shows the first featured video large, then the rest in this order.
      </p>

      {!isSupabaseAdminConfigured ? (
        <p className="mb-6 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Configure Supabase to persist changes. (Edits won’t save in demo mode.)
        </p>
      ) : null}

      <ListEditor
        list="media"
        items={videos}
        title="Listen & Watch"
        description="Up to three featured videos appear in the home page reel. Videos load only when a visitor presses play."
      />
    </div>
  );
}
