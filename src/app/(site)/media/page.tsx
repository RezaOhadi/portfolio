import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { PianoDivider } from "@/components/ui/PianoDivider";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { MediaExplorer } from "@/components/media/MediaExplorer";
import { Reveal } from "@/components/motion/Reveal";
import { getMediaItems } from "@/lib/data/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Media",
  description: "Performances, studio sessions and original recordings.",
};

export default async function MediaPage() {
  const media = await getMediaItems();
  const featured = media.find((m) => m.featured && m.type === "youtube") ?? media[0];
  const rest = media.filter((m) => m.id !== featured?.id);

  return (
    <>
      <PageHeader
        kicker="Media"
        title="Performances & recordings"
        description="A selection of live performances, studio sessions and original compositions. Videos load only when you press play."
      />

      {featured ? (
        <section className="container-editorial pb-20">
          <Reveal>
            <YouTubeEmbed
              url={featured.youtubeUrl}
              title={featured.title}
              poster={featured.poster}
              className="aspect-video"
            />
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-3xl text-ivory">{featured.title}</h2>
              <span className="kicker">{featured.category}</span>
            </div>
            {featured.description ? (
              <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-silver-300">
                {featured.description}
              </p>
            ) : null}
          </Reveal>
        </section>
      ) : null}

      <PianoDivider label="More" />

      <section className="container-editorial py-20 md:py-28">
        <MediaExplorer items={rest.length ? rest : media} />
      </section>
    </>
  );
}
