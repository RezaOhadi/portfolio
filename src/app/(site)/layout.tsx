import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollMouseIndicator } from "@/components/layout/ScrollMouseIndicator";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { getSocialLinks } from "@/lib/data/content";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const social = await getSocialLinks();

  return (
    <MotionProvider>
      {/* Scroll-linked scenes start transparent, so without JS they would never
          resolve. Reveal them for no-script readers. */}
      <noscript>
        <style>{".scroll-scene{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only z-[110] rounded-full bg-ivory px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Nav social={social} />
      <main id="main">{children}</main>
      <Footer social={social} />
      {/* Sitewide back-to-top; the downward "scroll" cue shows on the home page only. */}
      <ScrollMouseIndicator targetId="about" cuePath="/" />
    </MotionProvider>
  );
}
