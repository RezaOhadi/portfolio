import { Search } from "lucide-react";
import { getAllMembers, filterMembers } from "@/lib/data/members";
import { formatDate } from "@/lib/utils";
import { isSupabaseAdminConfigured } from "@/lib/env";

/** Date and time, for "last sign-in". */
function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await getAllMembers();
  const members = filterMembers(all, q);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ivory">Members</h1>
      <p className="mb-8 mt-1 font-sans text-sm text-silver-300">
        {all.length} account{all.length === 1 ? "" : "s"}
        {q ? ` · ${members.length} matching` : ""}
      </p>

      {!isSupabaseAdminConfigured ? (
        <p className="rounded-sm border border-white/15 bg-white/[0.03] px-4 py-3 font-sans text-xs text-silver-300">
          Configure Supabase to view members. (No account data in demo mode.)
        </p>
      ) : (
        <>
          <form method="get" className="mb-6 flex max-w-md items-center gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Search members</span>
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-400" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by username or email"
                autoComplete="off"
                className="w-full border-0 border-b border-white/20 bg-transparent py-2.5 pl-7 font-sans text-sm text-ivory placeholder:text-silver-400/60 focus:border-ivory focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="border border-white/25 px-4 py-2 font-sans text-[0.65rem] uppercase tracking-widest text-silver-200 transition-colors hover:border-ivory hover:text-ivory"
            >
              Search
            </button>
          </form>

          {members.length === 0 ? (
            <p className="rounded-sm border border-white/10 bg-white/[0.02] p-6 font-sans text-sm text-silver-400">
              {q ? "No members match that search." : "No members yet."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-white/10">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-white/[0.03] text-[0.65rem] uppercase tracking-widest text-silver-400">
                  <tr>
                    <th className="px-4 py-3 font-normal">Username</th>
                    <th className="px-4 py-3 font-normal">Email</th>
                    <th className="px-4 py-3 font-normal">Sign-in</th>
                    <th className="px-4 py-3 font-normal">Joined</th>
                    <th className="px-4 py-3 font-normal">Last sign-in</th>
                    <th className="px-4 py-3 text-right font-normal">Purchases</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-sm text-silver-200">
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-white/10">
                      <td className="whitespace-nowrap px-4 py-3 text-ivory">
                        {m.username ? `@${m.username}` : <span className="text-silver-400">—</span>}
                        {m.role === "admin" ? (
                          <span className="ml-2 rounded-full bg-ivory/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-ivory">
                            Admin
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {m.email ?? "—"}
                        {!m.emailConfirmed ? (
                          <span className="ml-2 text-[0.62rem] uppercase tracking-widest text-silver-400">
                            unconfirmed
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{m.signInMethod}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-silver-400">{formatDate(m.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-silver-400">
                        {m.lastSignInAt ? formatDateTime(m.lastSignInAt) : "Never"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
