import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { placeholderProducts } from "./placeholder";
import { mapProductRow } from "./mappers";
import type { Product } from "@/lib/types";

/**
 * Catalogue reads. Falls back to built-in placeholders when Supabase isn't
 * configured (or on error), so the store always renders.
 */

export async function getProducts(
  { includeUnpublished = false }: { includeUnpublished?: boolean } = {},
): Promise<Product[]> {
  // Unpublished rows require service-role (RLS hides them from anon).
  const supabase = includeUnpublished
    ? createSupabaseAdminClient()
    : createSupabasePublicClient();

  if (!supabase) {
    return includeUnpublished
      ? placeholderProducts
      : placeholderProducts.filter((p) => p.published);
  }

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!includeUnpublished) query = query.eq("published", true);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[products] read failed, using placeholders:", error.message);
    return includeUnpublished
      ? placeholderProducts
      : placeholderProducts.filter((p) => p.published);
  }
  return data.map(mapProductRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return placeholderProducts.find((p) => p.slug === slug && p.published) ?? null;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return placeholderProducts.find((p) => p.slug === slug) ?? null;
  return mapProductRow(data);
}

/** Admin-only: fetch any product (published or not) by id. */
export async function getProductByIdAdmin(id: string): Promise<Product | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return placeholderProducts.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapProductRow(data);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const all = await getProducts();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const related = product.relatedSlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => Boolean(p) && p!.slug !== product.slug);
  // Top up with other products if related list is short.
  if (related.length < limit) {
    for (const p of all) {
      if (related.length >= limit) break;
      if (p.slug !== product.slug && !related.includes(p)) related.push(p);
    }
  }
  return related.slice(0, limit);
}

/** For generateStaticParams / sitemap. */
export async function getAllProductSlugs(): Promise<string[]> {
  const products = await getProducts();
  return products.map((p) => p.slug);
}
