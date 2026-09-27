import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Receipt photos are compressed in the browser first, but leave some room
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        // The service worker must never be cached, or users would be stuck on an old version
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
