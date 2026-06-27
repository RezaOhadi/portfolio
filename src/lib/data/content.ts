import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { defaultContent } from "./placeholder";
import type {
  BioContent,
  HeroContent,
  HomeContent,
  MediaItem,
  SiteContent,
  SocialLinks,
} from "@/lib/types";

export type ContentKey = "social" | "hero" | "home" | "bio" | "media";

/**
 * Reads the full structured site content, merging any DB overrides (site_content
 * key/value rows) on top of the built-in defaults.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return defaultContent;

  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error || !data) return defaultContent;

  const map = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<
    string,
    unknown
  >;

  return {
    social: { ...defaultContent.social, ...(map.social as object | undefined) },
    hero: { ...defaultContent.hero, ...(map.hero as object | undefined) },
    home: { ...defaultContent.home, ...(map.home as object | undefined) },
    bio: { ...defaultContent.bio, ...(map.bio as object | undefined) },
    media: Array.isArray(map.media) ? (map.media as MediaItem[]) : defaultContent.media,
  };
}

export async function getSocialLinks(): Promise<SocialLinks> {
  return (await getSiteContent()).social;
}
export async function getHeroContent(): Promise<HeroContent> {
  return (await getSiteContent()).hero;
}
export async function getHomeContent(): Promise<HomeContent> {
  return (await getSiteContent()).home;
}
export async function getBioContent(): Promise<BioContent> {
  return (await getSiteContent()).bio;
}
export async function getMediaItems(): Promise<MediaItem[]> {
  return (await getSiteContent()).media;
}

/** Admin write: upsert a single content key. */
export async function upsertContent(
  key: ContentKey,
  value: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase admin not configured." };
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
