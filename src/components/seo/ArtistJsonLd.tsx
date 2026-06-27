import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import type { SocialLinks } from "@/lib/types";

/** Structured data for the artist profile (helps search + rich results). */
export function ArtistJsonLd({ social }: { social: SocialLinks }) {
  const sameAs = [social.instagram, social.youtube, social.soundcloud].filter(Boolean);
  const json = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: siteConfig.name,
    url: siteConfig.url,
    image: absoluteUrl("/opengraph-image"),
    genre: ["Classical", "Contemporary Classical", "Piano"],
    jobTitle: "Pianist & Composer",
    description: siteConfig.description,
    sameAs,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
