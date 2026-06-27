import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { getSocialLinks } from "@/lib/data/content";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const social = await getSocialLinks();

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[110] rounded-full bg-ivory px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Nav social={social} />
      <main id="main">{children}</main>
      <Footer social={social} />
    </>
  );
}
