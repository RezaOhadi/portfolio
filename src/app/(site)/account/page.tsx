import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, KeyRound, AtSign } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MemberSignOut } from "@/components/account/MemberSignOut";
import { requireMember, claimPurchases } from "@/lib/member";
import { getPurchasesForMember } from "@/lib/data/purchases";
import { formatDate, formatPrice } from "@/lib/utils";
import cta from "@/components/golden-grand/lets-play.module.css";
import styles from "@/components/account/account.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const member = await requireMember("/account");
  if (!member.profile?.username) redirect("/account/username?next=%2Faccount");

  // Guest purchases made with this (verified) email join the account here.
  await claimPurchases(member);
  const purchases = await getPurchasesForMember(member.id, member.email);

  return (
    <>
      <PageHeader
        kicker={`@${member.profile.username}`}
        title="Your scores"
        description="Every score you have purchased, ready to download. Anything you buy while signed in appears here on its own."
      />

      <section className="container-editorial grid gap-12 pb-28 md:grid-cols-12 md:pb-40">
        <div className="md:col-span-7">
          {purchases.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-sm border border-white/15 bg-white/[0.03] p-8">
              <h2 className="font-serif text-2xl text-ivory">No scores yet</h2>
              <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
                When you purchase sheet music it will be listed here. Bought something
                as a guest with a different email? Use the{" "}
                <Link href="/library" className="text-ivory underline-offset-4 hover:underline">
                  email library
                </Link>{" "}
                for that address.
              </p>
              <Link href="/store" className={`${cta.cta} ${styles.download}`}>
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <ul>
              {purchases.map((p) => (
                <li key={p.id} className={styles.rowItem}>
                  <div>
                    <h2 className="font-serif text-2xl leading-tight text-ivory">
                      {p.productSlug ? (
                        <Link href={`/store/${p.productSlug}`} className="hover:text-white">
                          {p.productTitle ?? "Sheet music"}
                        </Link>
                      ) : (
                        (p.productTitle ?? "Sheet music")
                      )}
                    </h2>
                    <p className="mt-1 font-sans text-xs text-silver-400">
                      {formatDate(p.createdAt)} · {formatPrice(p.amountCents, p.currency)}
                    </p>
                  </div>
                  <a
                    href={`/api/download?token=${p.downloadToken}`}
                    className={`${cta.cta} ${styles.download}`}
                    aria-label={`Download ${p.productTitle ?? "score"} (PDF)`}
                  >
                    <Download aria-hidden /> Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="md:col-span-5 md:border-l md:border-white/10 md:pl-14">
          <h2 className="kicker mb-5">Account</h2>
          <dl className="flex flex-col gap-4 font-sans text-sm">
            <div>
              <dt className="text-silver-400">Username</dt>
              <dd className="mt-0.5 text-ivory">@{member.profile.username}</dd>
            </div>
            <div>
              <dt className="text-silver-400">Email</dt>
              <dd className="mt-0.5 break-all text-ivory">{member.email}</dd>
            </div>
          </dl>
          <ul className="mt-8 flex flex-col gap-4">
            <li>
              <Link href="/account/username" className={styles.ghostButton}>
                <AtSign aria-hidden /> Change username
              </Link>
            </li>
            <li>
              <Link href="/account/password" className={styles.ghostButton}>
                <KeyRound aria-hidden /> {member.hasPassword ? "Change password" : "Set a password"}
              </Link>
            </li>
            <li>
              <MemberSignOut />
            </li>
          </ul>
          <p className="mt-10 max-w-sm font-sans text-xs leading-relaxed text-silver-400">
            Each download link opens a fresh, time-limited copy of your PDF. Your
            files are stored privately and are never publicly accessible.
          </p>
        </aside>
      </section>
    </>
  );
}
