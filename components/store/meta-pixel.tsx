"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useState } from "react";
import { isInternalVisitor } from "@/lib/analytics/track";

// Meta (Facebook/Instagram) Pixel, so ads can optimise for purchases.
// Funnel events (ViewContent, AddToCart, …) are sent from lib/analytics/track.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Pages mount their own StoreShell, so keep the last tracked path at module
// scope to avoid duplicate PageViews on remount.
let lastTrackedPath: string | null = null;

function PageViewLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === lastTrackedPath) {
      return;
    }
    const isFirstLoad = lastTrackedPath === null;
    lastTrackedPath = pathname;
    // The base code tracks the landing PageView itself.
    if (!isFirstLoad) {
      window.fbq?.("track", "PageView");
    }
  }, [pathname]);

  return null;
}

/** Loads the Meta Pixel and sends PageViews. No-op until configured. */
export function MetaPixel() {
  // localStorage is only readable after mount, so decide there to keep
  // hydration stable; admin browsers never load the pixel.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(!isInternalVisitor());
  }, []);

  if (!PIXEL_ID || !enabled) {
    return null;
  }
  // Standard Meta base code: defines a queueing fbq stub, then loads fbevents.js.
  const baseCode = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {baseCode}
      </Script>
      <Suspense fallback={null}>
        <PageViewLogger />
      </Suspense>
    </>
  );
}
