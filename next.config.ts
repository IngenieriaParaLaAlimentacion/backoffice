import type { NextConfig } from "next";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/";

const DESTINATIONS_BASE_URL = new URL("/api/:path*", API_BASE_URL);

console.log(API_BASE_URL);

const nextConfig: NextConfig = {
  output: "standalone",
  // Type-checks every <Link href> and router.push() against the app/ folders,
  // so a link to a page that doesn't exist fails `npm run typecheck`.
  typedRoutes: true,
  // Establishment-creation requests moved from Establecimientos into the
  // Solicitudes section; keep bookmarks and old links working (Next.js
  // forwards the query string, so saved filters survive).
  async redirects() {
    return [
      {
        source: "/dashboard/establishments/requests",
        destination: "/dashboard/requests/establishment-creations",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: DESTINATIONS_BASE_URL.toString() },
    ];
  },
};

export default nextConfig;
