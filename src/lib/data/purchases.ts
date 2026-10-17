import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapPurchaseRow } from "./mappers";
import type { Purchase, PurchaseStatus } from "@/lib/types";

/**
 * Purchase access — ALWAYS via the service-role client (purchases are private;
 * no public RLS read). Returns null/[] when Supabase admin isn't configured.
 */

export interface NewPurchase {
  productId: string;
  productSlug: string | null;
  productTitle: string | null;
  customerEmail: string;
  stripeSessionId: string;
  stripePaymentIntent: string | null;
  amountCents: number;
  currency: string;
  status: PurchaseStatus;
  /** The signed-in member who bought it, if any (guest checkout leaves it null). */
  userId?: string | null;
}

export interface UpsertResult {
  purchase: Purchase;
  created: boolean;
}

/**
 * Idempotent on stripe_session_id — safe to call from both webhook and success
 * page. `created` is true only the first time, so callers send the email once.
 */
export async function upsertPurchase(p: NewPurchase): Promise<UpsertResult | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  // Already recorded? Return existing (preserves the original download token).
  const existing = await getPurchaseBySessionId(p.stripeSessionId);
  if (existing) return { purchase: existing, created: false };

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      product_id: p.productId,
      product_slug: p.productSlug,
      product_title: p.productTitle,
      customer_email: p.customerEmail.toLowerCase(),
      stripe_session_id: p.stripeSessionId,
      stripe_payment_intent: p.stripePaymentIntent,
      amount_cents: p.amountCents,
      currency: p.currency,
      status: p.status,
      user_id: p.userId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    // Possible race: another process inserted between our check and insert.
    const retry = await getPurchaseBySessionId(p.stripeSessionId);
    if (retry) return { purchase: retry, created: false };
    console.error("[purchases] insert failed:", error?.message);
    return null;
  }
  return { purchase: mapPurchaseRow(data), created: true };
}

export async function getPurchaseBySessionId(sessionId: string): Promise<Purchase | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  return data ? mapPurchaseRow(data) : null;
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase.from("purchases").select("*").eq("id", id).maybeSingle();
  return data ? mapPurchaseRow(data) : null;
}

export async function getPurchaseByToken(token: string): Promise<Purchase | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("download_token", token)
    .maybeSingle();
  return data ? mapPurchaseRow(data) : null;
}

export async function getPurchasesByEmail(email: string): Promise<Purchase[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("customer_email", email.toLowerCase())
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPurchaseRow);
}

/**
 * Member: paid purchases tied to their account, plus any still filed under
 * their email (claimPurchasesByEmail normally moves those over first).
 */
export async function getPurchasesForMember(
  userId: string,
  email: string | null,
): Promise<Purchase[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data: own } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid");
  const byEmail = email ? await getPurchasesByEmail(email) : [];
  const seen = new Set<string>();
  return [...(own ?? []).map(mapPurchaseRow), ...byEmail]
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Files guest purchases made with a (verified) email under the member's account. */
export async function claimPurchasesByEmail(userId: string, email: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("purchases")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("customer_email", email.toLowerCase());
  if (error) console.error("[purchases] claim failed:", error.message);
}

/** Admin: all purchases, newest first. */
export async function getAllPurchases(): Promise<Purchase[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPurchaseRow);
}
