"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./account.module.css";

/** Sign-out for the account page. The header menu has its own. */
export function MemberSignOut() {
  const router = useRouter();
  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={signOut} className={styles.ghostButton}>
      <LogOut aria-hidden /> Sign out
    </button>
  );
}
