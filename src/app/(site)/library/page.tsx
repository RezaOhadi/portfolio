import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LibraryForm } from "@/components/library/LibraryForm";

export const metadata: Metadata = {
  title: "My Library",
  description: "Access the sheet music you've purchased.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "No download link was provided. Request a fresh one below.",
  invalid: "That download link is invalid or has been revoked.",
  unpaid: "This purchase hasn't completed payment yet.",
  unavailable:
    "This file isn't available right now. If you believe this is an error, please get in touch.",
  expired: "Your download link expired. Request a fresh one below.",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid : null;

  return (
    <>
      <PageHeader
        kicker="My Library"
        title="Your purchased scores"
        description="Enter the email you used at checkout and we'll send secure links to every score you own. No account required."
      />

      <section className="container-editorial grid gap-12 pb-28 md:grid-cols-12 md:pb-40">
        <div className="md:col-span-7">
          {errorMessage ? (
            <div className="mb-8 flex items-start gap-3 rounded-sm border border-white/15 bg-white/[0.03] p-5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-ivory" />
              <p className="font-sans text-sm leading-relaxed text-silver-200">
                {errorMessage}
              </p>
            </div>
          ) : null}
          <LibraryForm />
        </div>

        <aside className="md:col-span-5 md:border-l md:border-white/10 md:pl-14">
          <h2 className="kicker mb-5">How it works</h2>
          <ol className="flex flex-col gap-5 font-sans text-sm leading-relaxed text-silver-300">
            <li className="flex gap-3">
              <span className="font-serif text-xl text-ivory">1.</span>
              We email you a private link for each purchased score.
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-xl text-ivory">2.</span>
              Each link generates a fresh, time-limited, secure download.
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-xl text-ivory">3.</span>
              Your files are stored privately and are never publicly accessible.
            </li>
          </ol>
        </aside>
      </section>
    </>
  );
}
