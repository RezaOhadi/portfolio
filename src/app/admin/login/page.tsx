import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <span className="kicker">Reza Ohadi</span>
        <h1 className="mt-3 font-serif text-4xl text-ivory">Admin</h1>
        <p className="mb-10 mt-2 font-sans text-sm text-silver-300">
          Sign in to manage the catalogue and content.
        </p>

        {isSupabaseConfigured ? (
          <Suspense fallback={<div className="h-40 skeleton rounded-sm" />}>
            <LoginForm />
          </Suspense>
        ) : (
          <div className="rounded-sm border border-white/15 bg-white/[0.03] p-5 font-sans text-sm leading-relaxed text-silver-300">
            <p className="mb-2 uppercase tracking-widest text-ivory">Not configured</p>
            Supabase authentication isn’t set up in this environment. Add your
            Supabase credentials to <code className="text-ivory">.env.local</code>,
            create an account, and set its role to <code className="text-ivory">admin</code>.
            See the README for details.
          </div>
        )}
      </div>
    </div>
  );
}
