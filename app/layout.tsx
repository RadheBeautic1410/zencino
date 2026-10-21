import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/config/platform";
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
  icons: { icon: "/brand-mark.svg" },
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  verification: env.GOOGLE_SITE_VERIFICATION
    ? { google: env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      className={cn("font-sans", inter.variable, fraunces.variable)}
      lang="en"
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
