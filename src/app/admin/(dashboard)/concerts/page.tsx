import { getSiteContent } from "@/lib/data/content";
import { ListEditor } from "@/components/admin/ListEditor";
import { isSupabaseAdminConfigured } from "@/lib/env";

export default async function AdminConcertsPage() {
  const content = await getSiteContent();
  const concerts = content.home.performances;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ivory">Concerts</h1>
      <p className="mb-8 mt-1 font-sans text-sm text-silver-300">
        {concerts.length} concert{concerts.length === 1 ? "" : "s"} · shown on the home page under
        “On stage”, in this order. The “Next at the piano” card lists the first three upcoming ones.
      </p>

      {!isSupabaseAdminConfigured ? (
        <p className="mb-6 rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Configure Supabase to persist changes. (Edits won’t save in demo mode.)
        </p>
      ) : null}

      <ListEditor
        list="home.performances"
        items={concerts}
        title="Concert dates"
        description="Title, venue, city and date are shown on the site; a ticket link adds a “Tickets” link to the row."
      />
    </div>
  );
}
