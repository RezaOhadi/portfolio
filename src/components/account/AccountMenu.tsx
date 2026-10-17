"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, LogOut, UserRound } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import styles from "./account.module.css";

type State =
  | { status: "pending" }
  | { status: "out" }
  | { status: "in"; username: string | null; email: string | null };

/** Fired by the username form so the header picks up the new handle. */
export const PROFILE_EVENT = "member:profile";

/**
 * Who is signed in, read in the browser so the pages around the header stay
 * static. The Supabase client loads only after paint.
 */
function useMember() {
  const [state, setState] = useState<State>({ status: "pending" });
  const client = useRef<SupabaseClient | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    let refresh = () => {};
    (async () => {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      if (cancelled) return;
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setState({ status: "out" });
        return;
      }
      client.current = supabase;
      const load = async (userId: string, email: string | null) => {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .maybeSingle();
        if (!cancelled) setState({ status: "in", username: data?.username ?? null, email });
      };
      // Emits INITIAL_SESSION at once, then every sign-in / sign-out / refresh.
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // Supabase asks that its own calls not be awaited inside this callback.
        setTimeout(() => {
          if (cancelled) return;
          if (!session?.user) setState({ status: "out" });
          else void load(session.user.id, session.user.email ?? null);
        }, 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      refresh = () => {
        void supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) void load(session.user.id, session.user.email ?? null);
        });
      };
      window.addEventListener(PROFILE_EVENT, refresh);
    })();
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener(PROFILE_EVENT, refresh);
    };
  }, []);

  const signOut = useCallback(async () => {
    await client.current?.auth.signOut();
    setState({ status: "out" });
    if (pathname.startsWith("/account")) router.push("/");
    router.refresh();
  }, [pathname, router]);

  return { state, signOut };
}

/**
 * The header's member slot: a discreet gold "Sign in", or "@username" with a
 * tiny menu (Account, Sign out). Between 381px and 460px the header row has
 * no room beside the full "Let's Play" pill, so this hides and
 * AccountMenuItems takes over inside the full-screen menu.
 */
export function AccountMenu() {
  const { state, signOut } = useMember();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }, []);

  const toggle = () => {
    if (open) return close();
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.bottom + 8,
      // The fixed menu's containing block excludes the scrollbar; so does clientWidth.
      right: Math.max(12, document.documentElement.clientWidth - rect.right),
    });
    setOpen(true);
  };

  // Any navigation closes the menu.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menu.current?.contains(t) || trigger.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onMove = () => close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, { passive: true });
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove);
    };
  }, [open, close]);

  if (state.status !== "in") {
    return (
      <div className={`${styles.slot} ${state.status === "pending" ? styles.pending : ""}`}>
        <Link href="/sign-in" className={styles.link} aria-label="Sign in to your account">
          <UserRound className={styles.icon} aria-hidden />
          <span className={styles.text}>Sign in</span>
        </Link>
      </div>
    );
  }

  const label = state.username ? `@${state.username}` : "Account";

  return (
    <div className={styles.slot}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu, signed in as ${label}`}
        onClick={toggle}
      >
        <UserRound className={styles.icon} aria-hidden />
        <span className={styles.dot} aria-hidden />
        <span className={styles.handle}>{label}</span>
        <ChevronDown className={styles.chev} aria-hidden />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menu}
              role="menu"
              aria-label="Account"
              className={styles.menu}
              style={{ top: pos.top, right: pos.right }}
            >
              <div className={styles.menuName}>{label}</div>
              <Link role="menuitem" href="/account" className={styles.item} onClick={() => close()}>
                <UserRound aria-hidden /> Account
              </Link>
              <button
                role="menuitem"
                type="button"
                className={styles.item}
                onClick={() => {
                  close();
                  void signOut();
                }}
              >
                <LogOut aria-hidden /> Sign out
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * The same entry inside the full-screen menu, shown only between 381px and
 * 460px (where the header slot is hidden). Styled like the menu's other
 * utility links.
 */
export function AccountMenuItems({ onNavigate }: { onNavigate?: () => void }) {
  const { state, signOut } = useMember();
  if (state.status === "pending") return null;
  if (state.status !== "in") {
    return (
      <div className={styles.dialogItems}>
        <Link href="/sign-in" onClick={onNavigate}>
          Sign in
          <ArrowUpRight size={18} aria-hidden />
        </Link>
      </div>
    );
  }
  const label = state.username ? `@${state.username}` : "Account";
  return (
    <div className={styles.dialogItems}>
      <Link href="/account" onClick={onNavigate}>
        <span className={styles.dialogHandle}>{label}</span>
        <ArrowUpRight size={18} aria-hidden />
      </Link>
      <button
        type="button"
        className={styles.dialogButton}
        onClick={() => {
          onNavigate?.();
          void signOut();
        }}
      >
        Sign out
        <LogOut size={18} aria-hidden />
      </button>
    </div>
  );
}
