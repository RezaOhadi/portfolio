/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
