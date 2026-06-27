"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-silver-300 transition-colors hover:text-ivory"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
