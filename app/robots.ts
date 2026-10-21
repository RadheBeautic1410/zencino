import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://zencino.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, per-user or transactional pages have no search value.
        disallow: [
          "/admin",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/track-order",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
