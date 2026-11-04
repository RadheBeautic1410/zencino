import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import {
  LOGO_PATH,
  PRODUCT_DESCRIPTION,
  PRODUCT_NAME,
} from "@/config/platform";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Champagne-era serif for headings; pairs with Inter for UI and body copy.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: PRODUCT_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    locale: "en_IN",
    images: [{ url: LOGO_PATH, width: 1200, height: 262, alt: PRODUCT_NAME }],
  },
  verification: env.GOOGLE_SITE_VERIFICATION
    ? { google: env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// Tells search engines the site's name and that this domain is the brand.
// Add `sameAs` to the Organization once the official social profiles are confirmed.
const siteUrl = new URL("/", env.NEXT_PUBLIC_APP_URL).href;
const brandJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: PRODUCT_NAME,
      url: siteUrl,
      logo: new URL(LOGO_PATH, siteUrl).href,
      description: PRODUCT_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      name: PRODUCT_NAME,
      url: siteUrl,
      publisher: { "@id": `${siteUrl}#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={cn("font-sans", inter.variable, fraunces.variable)}
      lang="en"
    >
      <body suppressHydrationWarning>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data built from constants in this file.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }}
          type="application/ld+json"
        />
        {children}
      </body>
    </html>
  );
}
