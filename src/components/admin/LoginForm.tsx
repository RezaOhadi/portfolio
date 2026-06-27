"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(params.get("redirect") || "/admin");
    router.refresh();
  }

  const input =
    "w-full border-0 border-b border-white/20 bg-transparent py-3 font-sans text-ivory placeholder:text-silver-400/60 focus:border-ivory focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <label className="block">
        <span className="kicker mb-1 block normal-case tracking-wider text-silver-400">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
          placeholder="you@email.com"
        />
      </label>
      <label className="block">
        <span className="kicker mb-1 block normal-case tracking-wider text-silver-400">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ivory">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 border border-ivory bg-ivory px-6 py-3.5 font-sans text-[0.72rem] uppercase tracking-widest text-ink transition-colors hover:bg-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
