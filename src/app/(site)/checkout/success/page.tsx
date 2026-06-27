import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { fulfillCheckout } from "@/lib/stripe/fulfill";

export const metadata: Metadata = {
  title: "Order complete",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let state:
    | { kind: "ok"; token: string; title: string }
    | { kind: "pending" }
    | { kind: "error"; message: string };

  if (!session_id) {
    state = { kind: "error", message: "No order reference was provided." };
  } else {
    const result = await fulfillCheckout(session_id);
    if (result.ok) {
      state = {
        kind: "ok",
        token: result.purchase.downloadToken,
        title: result.purchase.productTitle ?? "your score",
      };
    } else if (result.reason === "not_paid") {
      state = { kind: "pending" };
    } else if (result.reason === "not_configured") {
      state = {
        kind: "error",
        message: "Payments aren't fully configured in this environment.",
      };
    } else {
      state = {
        kind: "error",
        message:
          "We received your payment but couldn't finalise the download automatically. Please use the library page, or contact us and we'll sort it out right away.",
      };
    }
  }

  return (
    <section className="container-editorial flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
      <Reveal>
        {state.kind === "ok" ? (
          <div className="flex flex-col items-center gap-6">
            <CheckCircle2 className="h-14 w-14 text-ivory" />
            <span className="kicker">Payment confirmed</span>
            <h1 className="max-w-2xl font-serif text-4xl leading-tight text-ivory sm:text-5xl">
              Thank you — {state.title} is ready
            </h1>
            <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
              A confirmation with your secure download link is on its way to your
              inbox. You can also download it right now.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              <Button href={`/api/download?token=${state.token}`} variant="primary" size="lg">
                <Download className="h-4 w-4" /> Download your PDF
              </Button>
              <Button href="/store" variant="outline" size="lg">
                Continue browsing
              </Button>
            </div>
            <Link
              href="/library"
              className="mt-2 text-[0.72rem] uppercase tracking-widest text-silver-400 transition-colors hover:text-ivory"
            >
              Access your library later
            </Link>
          </div>
        ) : state.kind === "pending" ? (
          <div className="flex flex-col items-center gap-6">
            <Clock className="h-14 w-14 text-ivory" />
            <span className="kicker">Processing</span>
            <h1 className="max-w-2xl font-serif text-4xl leading-tight text-ivory sm:text-5xl">
              Your payment is being confirmed
            </h1>
            <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
              This can take a moment. We'll email your download link as soon as it
              clears. You can also retrieve it anytime from your library.
            </p>
            <Button href="/library" variant="primary" size="lg">
              Go to my library
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <AlertCircle className="h-14 w-14 text-ivory" />
            <span className="kicker">A small hiccup</span>
            <h1 className="max-w-2xl font-serif text-4xl leading-tight text-ivory sm:text-5xl">
              Something needs a closer look
            </h1>
            <p className="max-w-prose font-sans text-sm leading-relaxed text-silver-300">
              {state.message}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button href="/library" variant="primary" size="lg">
                My library
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Contact support
              </Button>
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}
