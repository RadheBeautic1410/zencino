import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/orbit/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/account/:path*",
        permanent: true,
      },
      {
        // Official-rules link used by the Arrow Shift app's Zencino Challenge.
        // Not permanent, so the target can move without stale browser caches.
        source: "/zencino-challenge",
        destination: "/policies/zencino-challenge",
        permanent: false,
      },
    ];
  },
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
