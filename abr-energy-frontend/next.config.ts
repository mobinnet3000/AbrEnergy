import type { NextConfig } from "next";

// Phase 5.2 — the catalog serves backend media through `next/image`, so the
// configured media origin must be an allowed remote. Local dev hosts stay
// explicit; any NON-local host is derived from NEXT_PUBLIC_API_URL (no
// production CDN/domain is hardcoded, no broad wildcards are opened).
function mediaRemotePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
  ];
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
    const url = new URL(raw);
    const host = url.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      patterns.push({
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: host,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/media/**",
      });
    }
  } catch {
    // Unparseable/missing API URL: keep localhost-only (dev fallback).
  }
  return patterns;
}

const nextConfig: NextConfig = {
  // Isolated dist dir when NEXT_DIST_DIR is set, so `next build`/`next start`
  // never share `.next` with a running `next dev` (vendor-chunk failure).
  // Unset = default `.next`, zero behavior change.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: mediaRemotePatterns(),
  },
  async redirects() {
    return [
      {
        source: '/:locale/admin/project-inquiries/:id*',
        destination: '/:locale/admin/inquiries/:id*',
        permanent: false,
      },
      {
        source: '/admin/project-inquiries/:id*',
        destination: '/admin/inquiries/:id*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
