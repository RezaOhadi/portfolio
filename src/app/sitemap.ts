import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/data/products";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, priority: 1 },
    { url: absoluteUrl("/store"), lastModified: now, priority: 0.9 },
    { url: absoluteUrl("/biography"), lastModified: now, priority: 0.7 },
    { url: absoluteUrl("/gallery"), lastModified: now, priority: 0.6 },
    { url: absoluteUrl("/media"), lastModified: now, priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, priority: 0.5 },
  ];

  const productRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(`/store/${slug}`),
    lastModified: now,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
