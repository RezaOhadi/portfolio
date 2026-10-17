import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, NotConfigured } from "@/components/account/AuthCard";
import { ForgotForm } from "@/components/account/ForgotForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      lead="Enter your email and we will send a link to choose a new one."
      footer={
        <>
          Remembered it? <Link href="/sign-in">Sign in</Link>
        </>
      }
    >
      {isSupabaseConfigured ? <ForgotForm /> : <NotConfigured />}
    </AuthCard>
  );
}
