import type { NextConfig } from "next";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/";

const DESTINATIONS_BASE_URL = new URL("/api/:path*", API_BASE_URL);

console.log(API_BASE_URL);

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: DESTINATIONS_BASE_URL.toString() },
    ];
  },
};

export default nextConfig;
