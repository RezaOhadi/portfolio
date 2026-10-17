import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, NotConfigured } from "@/components/account/AuthCard";
import { GoogleButton } from "@/components/account/GoogleButton";
import { SignUpForm } from "@/components/account/SignUpForm";
import { isSupabaseConfigured } from "@/lib/env";
import styles from "@/components/account/account.module.css";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Reza Ohadi member account to keep your purchased scores in one place.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      lead="Keep every score you buy in one place, ready to download whenever you need it."
      footer={
        <>
          Already a member? <Link href="/sign-in">Sign in</Link>
        </>
      }
    >
      {isSupabaseConfigured ? (
        <>
          <GoogleButton next="/account" />
          <div className={styles.divider} aria-hidden>
            or with email
          </div>
          <SignUpForm />
        </>
      ) : (
        <NotConfigured />
      )}
    </AuthCard>
  );
}
