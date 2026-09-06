import { createSupabasePublicClient } from "@/lib/supabase/public";
import { placeholderGallery } from "./placeholder";
import { mapGalleryRow } from "./mappers";
import localGallery from "@/config/gallery.generated.json";
import type { GalleryImage } from "@/lib/types";

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const local: GalleryImage[] = localGallery;
  const fallback = local.length
    ? local
    : placeholderGallery.map((image, i) => ({
        ...image,
        imageUrl: "/assets/images/gallery/placeholder-" + (i + 1) + ".svg",
      }));
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return fallback;
  const remote = data.map(mapGalleryRow);
  const urls = new Set(remote.map((image) => image.imageUrl));
  return [...remote, ...local.filter((image) => !urls.has(image.imageUrl))];
}
