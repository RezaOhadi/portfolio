"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { upsertContent, getSiteContent } from "@/lib/data/content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadToBucket, publicAssetUrl } from "@/lib/supabase/storage";
import { env } from "@/lib/env";

export interface ContentState {
  status: "idle" | "success" | "error";
  message?: string;
}

function s(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

async function upload(file: FormDataEntryValue | null, prefix: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const res = await uploadToBucket(env.publicBucket, `${prefix}-${Date.now()}.${ext}`, file, file.type);
  return "error" in res ? null : publicAssetUrl(res.path);
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function saveSocial(_p: ContentState, fd: FormData): Promise<ContentState> {
  await requireAdmin();
  const cur = (await getSiteContent()).social;
  const res = await upsertContent("social", {
    ...cur,
    instagram: s(fd, "instagram"),
    youtube: s(fd, "youtube"),
    soundcloud: s(fd, "soundcloud"),
    email: s(fd, "email"),
  });
  if (!res.ok) return { status: "error", message: res.error };
  revalidatePublic();
  revalidatePath("/contact");
  return { status: "success", message: "Social links saved." };
}

export async function saveHome(_p: ContentState, fd: FormData): Promise<ContentState> {
  await requireAdmin();
  const cur = (await getSiteContent()).home;
  const res = await upsertContent("home", {
    ...cur,
    artistStatement: s(fd, "artistStatement"),
    featuredProductSlug: s(fd, "featuredProductSlug") || null,
  });
  if (!res.ok) return { status: "error", message: res.error };
  revalidatePublic();
  return { status: "success", message: "Home content saved." };
}

export async function saveBio(_p: ContentState, fd: FormData): Promise<ContentState> {
  await requireAdmin();
  const cur = (await getSiteContent()).bio;
  const portraitImage = (await upload(fd.get("portrait"), "bio/portrait")) ?? cur.portraitImage;
  const wideImage = (await upload(fd.get("wide"), "bio/wide")) ?? cur.wideImage;
  const signatureImage = (await upload(fd.get("signature"), "bio/signature")) ?? cur.signatureImage;

  const res = await upsertContent("bio", {
    ...cur,
    intro: s(fd, "intro"),
    statement: s(fd, "statement"),
    philosophy: s(fd, "philosophy"),
    portraitImage,
    wideImage,
    signatureImage,
  });
  if (!res.ok) return { status: "error", message: res.error };
  revalidatePublic();
  revalidatePath("/biography");
  return { status: "success", message: "Biography saved." };
}

export async function addGalleryImage(fd: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const url = await upload(fd.get("image"), "gallery/img");
  if (!url) return;
  await supabase.from("gallery_images").insert({
    image_url: url,
    caption: s(fd, "caption") || null,
    location: s(fd, "location") || null,
    event_date: s(fd, "event_date") || null,
    sort_order: parseInt(s(fd, "sort_order") || "0", 10) || 0,
    width: parseInt(s(fd, "width") || "1000", 10) || 1000,
    height: parseInt(s(fd, "height") || "1250", 10) || 1250,
  });
  revalidatePath("/gallery");
  revalidatePublic();
}

export async function deleteGalleryImage(fd: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const id = s(fd, "id");
  if (id) await supabase.from("gallery_images").delete().eq("id", id);
  revalidatePath("/gallery");
  revalidatePublic();
}
