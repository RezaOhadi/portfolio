import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, NotConfigured } from "@/components/account/AuthCard";
import { GoogleButton } from "@/components/account/GoogleButton";
import { SignInForm } from "@/components/account/SignInForm";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/member";
import styles from "@/components/account/account.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Reza Ohadi member account.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  return (
    <AuthCard
      title="Welcome back"
      lead="Sign in to download the scores you own."
      footer={
        <>
          New here? <Link href="/sign-up">Create an account</Link>
        </>
      }
    >
      {isSupabaseConfigured ? (
        <>
          <GoogleButton next={target} />
          <div className={styles.divider} aria-hidden>
            or
          </div>
          <SignInForm next={target} initialError={error} />
        </>
      ) : (
        <NotConfigured />
      )}
    </AuthCard>
  );
}
