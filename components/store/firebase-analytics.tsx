"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect } from "react";

// Firebase Analytics is backed by this Google Analytics 4 measurement ID, so
// gtag.js reports straight into the Firebase/GA dashboards without the web SDK.
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

// Pages mount their own StoreShell, so the tracker can remount on every
// navigation; keep the last logged URL at module scope to avoid duplicates.
let lastLoggedUrl: string | null = null;

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the arguments object itself, not an array copy.
  window.gtag =
    window.gtag ||
    function gtagShim() {
      // biome-ignore lint/complexity/noArguments: gtag.js reads the raw arguments object.
      window.dataLayer?.push(arguments);
    };
  window.gtag(...args);
}

function PageViewLogger({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (url === lastLoggedUrl) {
      return;
    }
    if (lastLoggedUrl === null) {
      gtag("js", new Date());
      // Page views are sent manually on client-side route changes below.
      gtag("config", measurementId, { send_page_view: false });
    }
    lastLoggedUrl = url;
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}

/** Sends storefront page views to Firebase / Google Analytics. No-op until configured. */
export function FirebaseAnalytics() {
  if (!MEASUREMENT_ID) {
    return null;
  }
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PageViewLogger measurementId={MEASUREMENT_ID} />
      </Suspense>
    </>
  );
}
