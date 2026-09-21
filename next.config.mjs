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
    ];
  },
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
