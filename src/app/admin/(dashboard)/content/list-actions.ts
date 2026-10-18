"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSiteContent, upsertContent } from "@/lib/data/content";
import { uploadToBucket, publicAssetUrl } from "@/lib/supabase/storage";
import { env } from "@/lib/env";
import { getListConfig, type ListConfig } from "@/lib/admin/lists";

type Item = Record<string, unknown>;

function text(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

async function uploadImage(file: FormDataEntryValue | null, prefix: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const res = await uploadToBucket(env.publicBucket, `${prefix}-${Date.now()}.${ext}`, file, file.type);
  return "error" in res ? null : publicAssetUrl(res.path);
}

/** Reads the configured fields from the form on top of an existing item. */
async function readItem(cfg: ListConfig, fd: FormData, existing: Item): Promise<Item | string> {
  if (cfg.scalar) return text(fd, cfg.fields[0].name);
  const item: Item = { ...existing };
  for (const f of cfg.fields) {
    if (f.type === "checkbox") item[f.name] = fd.get(f.name) === "on";
    else if (f.type === "image") {
      const uploaded = await uploadImage(fd.get(f.name), cfg.imagePrefix ?? "content/img");
      const current = text(fd, `${f.name}_current`);
      const remove = fd.get(`${f.name}_remove`) === "on";
      item[f.name] = uploaded ?? (remove ? null : current || null);
    } else item[f.name] = text(fd, f.name);
  }
  // A concert's "shown as" defaults to the date: today or later is upcoming.
  if ("status" in item && "date" in item && !item.status) {
    const today = new Date().toISOString().slice(0, 10);
    item.status = typeof item.date === "string" && item.date && item.date < today ? "past" : "upcoming";
  }
  return item;
}

/**
 * One action for every editable list (see lib/admin/lists.ts):
 * op = add | save | delete | up | down, with `list` and `index` from the form.
 */
export async function listAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const cfg = getListConfig(text(fd, "list"));
  if (!cfg) return;
  const op = text(fd, "op");
  const index = Number.parseInt(text(fd, "index"), 10);

  const content = await getSiteContent();
  const container = content[cfg.key] as unknown;
  const items: unknown[] = cfg.path
    ? [...(((container as Item)[cfg.path] as unknown[] | undefined) ?? [])]
    : [...((container as unknown[]) ?? [])];
  const valid = Number.isInteger(index) && index >= 0 && index < items.length;

  switch (op) {
    case "add": {
      const fresh = await readItem(cfg, fd, { ...(cfg.defaults ?? {}) });
      if (typeof fresh === "string") {
        if (!fresh) return;
        items.push(fresh);
      } else {
        if (cfg.withId) fresh.id = `m-${Date.now().toString(36)}`;
        items.push(fresh);
      }
      break;
    }
    case "save": {
      if (!valid) return;
      const existing = typeof items[index] === "object" && items[index] ? (items[index] as Item) : {};
      items[index] = await readItem(cfg, fd, existing);
      break;
    }
    case "delete":
      if (!valid) return;
      items.splice(index, 1);
      break;
    case "up":
      if (!valid || index === 0) return;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      break;
    case "down":
      if (!valid || index === items.length - 1) return;
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      break;
    default:
      return;
  }

  const value = cfg.path ? { ...(container as Item), [cfg.path]: items } : items;
  const res = await upsertContent(cfg.key, value);
  if (!res.ok) {
    console.error("[content] list save failed:", res.error);
    return;
  }
  for (const p of cfg.revalidate) revalidatePath(p);
  revalidatePath("/admin/content");
  revalidatePath("/admin/concerts");
  revalidatePath("/admin/media");
}
