import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import "./portfolio.css";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [
    "Reza Ohadi",
    "pianist",
    "composer",
    "sheet music",
    "piano sheet music",
    "contemporary classical",
    "cinematic piano",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0C",
  colorScheme: "dark",
};

/**
 * Slow connections: if the text choreography has not started 1.6s after navigation,
 * mark the page late so the hero copy shows by itself (journey.module.css). The
 * choreography reads the same flag and leaves that copy in place.
 */
const LATE_COPY = `setTimeout(function(){if(!window.__fxStarted&&location.pathname==="/")document.documentElement.classList.add("fx-late")},Math.max(0,1600-performance.now()))`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LATE_COPY }} />
      </head>
      <body className="grain min-h-screen bg-ink font-sans text-ivory antialiased">
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
