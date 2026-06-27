import { createSupabasePublicClient } from "@/lib/supabase/public";
import { placeholderGallery } from "./placeholder";
import { mapGalleryRow } from "./mappers";
import type { GalleryImage } from "@/lib/types";

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return placeholderGallery;

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return placeholderGallery;
  return data.map(mapGalleryRow);
}
