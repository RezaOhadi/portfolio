import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A stray package-lock.json in the user folder made Next guess that folder as
  // the workspace root; pin file tracing to this project.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Keep live preview and production builds from writing the same cache.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // We render our own decorative SVG placeholders; allow them through the optimizer.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Supabase Storage (replace project ref or keep wildcard)
      { protocol: "https", hostname: "*.supabase.co" },
      // YouTube thumbnails for Media page
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  // Lint is run separately (npm run lint). Keeping it out of the build avoids
  // blocking production builds on stylistic rules; type-checking stays enabled.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // The Golden Grand (/piano, served from public/golden-grand) may listen to a
  // MIDI keyboard and frames its own origin. These headers apply to those two
  // paths only; no other route gains or loses a header.
  async headers() {
    const midi = { key: "Permissions-Policy", value: "midi=(self)" };
    return [
      {
        source: "/piano",
        headers: [midi, { key: "Content-Security-Policy", value: "frame-src 'self'" }],
      },
      { source: "/golden-grand/:path*", headers: [midi] },
    ];
  },
  experimental: {
    serverActions: {
      // Default Server Action body limit is 1 MB, which rejects PDF uploads in
      // the admin product form. Raise it so sheet music can be uploaded.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
