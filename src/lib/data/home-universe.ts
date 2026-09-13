import type { Product, SiteContent } from "@/lib/types";
import heroGenerated from "@/config/hero.generated.json";
import { universeConfig } from "@/config/home-universe";

export interface UniverseWork {
  id: string;
  title: string;
  description: string;
  type: string;
  durationSeconds: number | null;
  href: string;
}

export interface HomeUniverseData {
  name: string;
  supporting: string;
  biography: string;
  portrait: string;
  works: UniverseWork[];
}

/** Explicit allowlist: never spread a Product across the server/client boundary. */
export function getHomeUniverseData(content: SiteContent, products: Product[]): HomeUniverseData {
  const published = products.filter((product) => product.published);
  const preferred = content.home.featuredProductSlug;
  const ordered = [...published].sort((a, b) =>
    Number(b.slug === preferred) - Number(a.slug === preferred) || Number(b.featured) - Number(a.featured),
  );
  return {
    name: content.hero.headline,
    supporting: content.hero.supporting,
    biography: content.bio.intro,
    portrait: content.hero.image && !content.hero.image.startsWith("/placeholders/")
      ? content.hero.image : heroGenerated.portrait,
    works: ordered.slice(0, universeConfig.maxWorks).map((product) => ({
      id: product.id,
      title: product.title,
      description: product.shortDescription,
      // Instrument is verified data; do not infer original/arrangement from a title.
      type: product.instrument || "Piano work",
      durationSeconds: Number.isFinite(product.durationSeconds) && product.durationSeconds > 0
        ? product.durationSeconds : null,
      href: `/store/${encodeURIComponent(product.slug)}`,
    })),
  };
}
