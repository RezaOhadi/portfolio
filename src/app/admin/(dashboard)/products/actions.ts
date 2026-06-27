"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadToBucket, publicAssetUrl } from "@/lib/supabase/storage";
import { productToRow } from "@/lib/data/mappers";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";

export interface ProductFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

async function uploadOptional(
  file: FormDataEntryValue | null,
  bucket: string,
  prefix: string,
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const res = await uploadToBucket(bucket, path, file, file.type);
  if ("error" in res) throw new Error(res.error);
  return res.path;
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { status: "error", message: "Supabase admin is not configured." };

  const id = str(formData, "id") || null;
  const title = str(formData, "title");
  if (!title) return { status: "error", message: "Title is required." };

  const slug = slugify(str(formData, "slug") || title);
  let savedSlug = slug;

  try {
    // Cover
    let coverImage = str(formData, "existing_cover") || "";
    const coverPath = await uploadOptional(formData.get("cover"), env.publicBucket, `covers/${slug}`);
    if (coverPath) coverImage = publicAssetUrl(coverPath);

    // Preview pages (replace set if any new files uploaded)
    let previewImages: string[] = [];
    try {
      previewImages = JSON.parse(str(formData, "existing_previews") || "[]");
    } catch {
      previewImages = [];
    }
    const previewFiles = formData.getAll("previews");
    const uploadedPreviews: string[] = [];
    let i = 0;
    for (const f of previewFiles) {
      const p = await uploadOptional(f, env.publicBucket, `previews/${slug}-${i++}`);
      if (p) uploadedPreviews.push(publicAssetUrl(p));
    }
    if (uploadedPreviews.length) previewImages = uploadedPreviews;

    // Private PDF
    let pdfPath = str(formData, "existing_pdf") || null;
    const newPdf = await uploadOptional(formData.get("pdf"), env.scoresBucket, `${slug}`);
    if (newPdf) pdfPath = newPdf;

    const relatedSlugs = str(formData, "related")
      .split(",")
      .map((s) => slugify(s.trim()))
      .filter(Boolean);

    const row = productToRow({
      slug,
      title,
      composer: str(formData, "composer") || "Reza Ohadi",
      shortDescription: str(formData, "short_description"),
      longDescription: str(formData, "long_description"),
      priceCents: Math.round(parseFloat(str(formData, "price") || "0") * 100),
      currency: str(formData, "currency") || "usd",
      difficulty: (str(formData, "difficulty") || "Intermediate") as Difficulty,
      instrument: str(formData, "instrument") || "Solo Piano",
      genre: str(formData, "genre"),
      mood: str(formData, "mood"),
      durationSeconds: parseInt(str(formData, "duration") || "0", 10) || 0,
      pages: parseInt(str(formData, "pages") || "0", 10) || 0,
      coverImage,
      previewImages,
      audioPreviewUrl: str(formData, "audio_preview_url") || null,
      youtubeUrl: str(formData, "youtube_url") || null,
      instagramUrl: str(formData, "instagram_url") || null,
      pdfPath,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
      relatedSlugs,
    });

    if (id) {
      const { error } = await supabase.from("products").update(row).eq("id", id);
      if (error) return { status: "error", message: error.message };
    } else {
      const { data, error } = await supabase.from("products").insert(row).select("slug").single();
      if (error) return { status: "error", message: error.message };
      savedSlug = data?.slug ?? slug;
    }
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Save failed." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/store");
  revalidatePath(`/store/${savedSlug}`);
  revalidatePath("/");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const id = str(formData, "id");
  if (id) await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/store");
}

export async function togglePublish(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const id = str(formData, "id");
  const published = str(formData, "published") === "true";
  if (id) await supabase.from("products").update({ published: !published }).eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/store");
}
