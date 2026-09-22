"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { recordClientAnalyticsAction } from "@/app/actions/campaigns";

const COOKIE_MAX_AGE_SECONDS = 2_592_000; // 30 days

/**
 * The CookieStore API is still unavailable in Safari and Firefox, so first-party
 * attribution cookies are written through document.cookie.
 */
function setTrackingCookie(name: string, value: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore lacks Safari/Firefox support.
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function TrackerContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      // 1. Resolve or create anonymous session ID
      let sessionId = localStorage.getItem("zen_anon_session");
      if (!sessionId) {
        sessionId = `anon_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
        localStorage.setItem("zen_anon_session", sessionId);
        setTrackingCookie("zen_anon_session", sessionId);
      }

      // 2. Parse UTM campaign parameters
      const utmCampaign =
        searchParams.get("utm_campaign") || searchParams.get("c");
      const utmSource = searchParams.get("utm_source") || "direct";
      const utmMedium = searchParams.get("utm_medium") || "referral";
      const utmContent = searchParams.get("utm_content") || "";

      let activeCampaignCode: string | null = null;

      if (utmCampaign) {
        activeCampaignCode = utmCampaign.toLowerCase().trim();
        const attributionData = {
          campaignCode: activeCampaignCode,
          source: utmSource,
          medium: utmMedium,
          content: utmContent,
          landingPath: pathname,
          recordedAt: new Date().toISOString(),
        };

        // Persist 30-day attribution cookie
        setTrackingCookie(
          "zen_attribution",
          encodeURIComponent(JSON.stringify(attributionData))
        );
      } else {
        // Read existing cookie if present
        const match = document.cookie.match(/(?:^|; )zen_attribution=([^;]*)/);
        if (match) {
          try {
            const parsed = JSON.parse(decodeURIComponent(match[1]));
            activeCampaignCode = parsed.campaignCode || null;
          } catch {
            // ignore
          }
        }
      }

      // 3. Emit page_view analytics event (once per unique path per minute)
      const currentTrackKey = `${pathname}:${activeCampaignCode || "none"}`;
      if (trackedRef.current !== currentTrackKey) {
        trackedRef.current = currentTrackKey;
        recordClientAnalyticsAction({
          eventName: "page_view",
          campaignCode: activeCampaignCode,
          path: pathname,
          anonymousSessionId: sessionId,
        }).catch(() => {
          // silent error handling for analytics
        });
      }
    } catch {
      // safe fallback
    }
  }, [pathname, searchParams]);

  return null;
}

export function CampaignTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
