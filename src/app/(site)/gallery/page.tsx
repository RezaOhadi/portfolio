import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { getGalleryImages } from "@/lib/data/gallery";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A black-and-white gallery — portraits, rehearsals and performances, presented like a quiet exhibition.",
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <>
      <PageHeader
        kicker="Gallery"
        title="Moments in black & white"
        description="A quiet exhibition of portraits, rehearsals and performances. Select any frame to view it full screen — navigate with the arrow keys."
      />
      <section className="container-editorial pb-28 md:pb-40">
        <GalleryLightbox images={images} />
      </section>
    </>
  );
}
