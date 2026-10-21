# Storefront analytics (Firebase / Google Analytics)

The storefront sends a `page_view` event to Google Analytics on every page and client-side navigation (`components/store/firebase-analytics.tsx`, mounted in `StoreShell`). Admin pages are not tracked.

It loads gtag.js with the Firebase web app's GA4 measurement ID, so data appears in both Firebase Analytics and Google Analytics without the Firebase web SDK or an API key:

```dotenv
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-322YJ824BQ
```

The ID belongs to the **Zencino Website** app in Firebase project `zencino-4ddbc` (Project settings > Your apps). Tracking stays off while it is empty. `NEXT_PUBLIC_` values are inlined at build time, so set it on the host and rebuild/redeploy after changing it.

Where to read the data:

- **Live visitors:** Firebase Console > Analytics > Realtime (or Google Analytics > Reports > Realtime).
- **Daily users:** Google Analytics > Reports > Engagement > Overview (Active users, Views per day).
- **Most visited pages:** Google Analytics > Reports > Engagement > Pages and screens.

Standard reports can take 24–48 hours to fill after the first visits; Realtime shows them within a minute.

## Search and shopping discovery

- `/robots.txt` (`app/robots.ts`) allows the storefront, blocks admin, account, cart, checkout, auth and API routes, and points to `/sitemap.xml`.
- **Google Search Console:** add `https://zencino.com` as a URL-prefix property, choose the **HTML tag** method, put its `content` value in `GOOGLE_SITE_VERIFICATION`, redeploy, then verify and submit `sitemap.xml`.
- **Google Merchant Center:** `/feeds/google-merchant.xml` lists every published product's active, website-enabled variants that have a price and at least one image (refreshed hourly). Add it under Products > Data sources as a scheduled-fetch file to get free Shopping listings.
- Product pages have WhatsApp, Telegram, Facebook and copy-link share buttons; shared links carry `utm_source=<channel>&utm_medium=social_share&utm_campaign=product_share`.
