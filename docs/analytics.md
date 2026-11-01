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

## Purchase funnel

`lib/analytics/track.ts` (`trackFunnel`) sends each funnel step to three places at once:

| Step | Fired from | Own DB (`analytics_events`) | GA4 | Meta Pixel |
|---|---|---|---|---|
| Product page opened | `product-detail-view.tsx` | `product_view` | `view_item` | `ViewContent` |
| Added to bag | `product-detail-view.tsx` | `add_to_cart` | `add_to_cart` | `AddToCart` |
| Checkout page opened | `checkout-view.tsx` | `checkout_started` | `begin_checkout` | `InitiateCheckout` |
| Order created, UPI shown | `checkout-view.tsx` | — | `add_payment_info` | `AddPaymentInfo` |
| Order success page | `order-success-view.tsx` | — | `purchase` | `Purchase` |
| Admin verifies payment | `lib/commerce/orders.ts` | `purchase_confirmed` | — | — |

The browser `purchase` fires once per order (guarded in localStorage) when the customer reaches the success page, before an admin verifies the UPI payment, so ads can optimise for it; verified sales are the `purchase_confirmed` rows.

**Admin > Campaigns** shows the all-traffic store funnel for the last 30 days (unique visitors per step, plus orders placed and payment-verified), above the per-campaign funnels.

**Admin visits are not counted.** When a signed-in admin browses the store, `recordClientAnalyticsAction` skips the event, flags all of that browser's earlier events with `properties.internal = true` (excluded from the store funnel), and the browser stores `zen_internal=1` in localStorage so GA4, the Meta Pixel and our own tracking stay off there from then on. Sign in as admin once on each of your devices to exclude them.

**Unpaid order follow-up:** **Admin > Orders** lists `pending_payment` orders (customer reached the UPI step but never paid) at the top with WhatsApp, call and email buttons and a prefilled payment reminder (`lib/commerce/follow-up.ts`). Keep these messages about that order; marketing messages need separate consent.

**Meta Pixel:** set `NEXT_PUBLIC_META_PIXEL_ID` (Meta Events Manager > Data sources) on the host and redeploy. The pixel stays off while it is empty. Check it with Events Manager > Test events.

## Search and shopping discovery

- `/robots.txt` (`app/robots.ts`) allows the storefront, blocks admin, account, cart, checkout, auth and API routes, and points to `/sitemap.xml`.
- **Google Search Console:** add `https://zencino.com` as a URL-prefix property, choose the **HTML tag** method, put its `content` value in `GOOGLE_SITE_VERIFICATION`, redeploy, then verify and submit `sitemap.xml`.
- **Google Merchant Center:** `/feeds/google-merchant.xml` lists every published product's active, website-enabled variants that have a price and at least one image (refreshed hourly). Add it under Products > Data sources as a scheduled-fetch file to get free Shopping listings.
- Product pages have WhatsApp, Telegram, Facebook and copy-link share buttons; shared links carry `utm_source=<channel>&utm_medium=social_share&utm_campaign=product_share`.
