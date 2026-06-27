import { createSupabaseAdminClient } from "./admin";
import { env } from "@/lib/env";

/**
 * Mints a short-lived signed URL for a private score PDF. The bucket is private;
 * direct object URLs are never exposed. The `download` option forces a
 * Content-Disposition attachment with a friendly filename.
 */
export async function createSignedDownloadUrl(
  path: string,
  downloadName?: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(env.scoresBucket)
    .createSignedUrl(path, env.downloadTtlSeconds, {
      download: downloadName ?? true,
    });

  if (error || !data) {
    console.error("[storage] signed url failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}

/** Upload to a bucket (admin only). Returns the stored path or an error. */
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File | ArrayBuffer | Buffer,
  contentType?: string,
): Promise<{ path: string } | { error: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "Storage not configured." };

  const body =
    file instanceof File ? file : file instanceof Buffer ? file : new Uint8Array(file);

  const { data, error } = await supabase.storage.from(bucket).upload(path, body, {
    upsert: true,
    contentType: contentType ?? (file instanceof File ? file.type : undefined),
  });
  if (error || !data) return { error: error?.message ?? "Upload failed." };
  return { path: data.path };
}

/** Public URL for an asset in the public bucket. */
export function publicAssetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = env.supabaseUrl?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${env.publicBucket}/${path}`;
}
