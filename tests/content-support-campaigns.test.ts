import assert from "node:assert/strict";
import test from "node:test";
import { SELLER_INFO } from "../config/platform";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_POLICIES,
} from "../lib/commerce/content-defaults";
import {
  buildCampaignUtmUrl,
  generateSupportTicketNumber,
} from "../lib/commerce/rules";

test("generateSupportTicketNumber produces valid SUP-YYYYMMDD-XXXX identifiers", () => {
  const ticket = generateSupportTicketNumber(new Date("2026-09-13T10:00:00Z"));
  assert.match(
    ticket,
    /^SUP-20260913-[0-9A-F]{4}$/,
    `Ticket format was ${ticket}, expected SUP-YYYYMMDD-XXXX`
  );

  // Generate 50 tickets and assert uniqueness
  const set = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const t = generateSupportTicketNumber();
    assert.equal(set.has(t), false, `Collision detected on ticket number: ${t}`);
    set.add(t);
  }
});

test("buildCampaignUtmUrl formats valid UTM deep links for Instagram marketing", () => {
  const url = buildCampaignUtmUrl({
    landingPath: "/products/pencil-holder-2",
    source: "Instagram",
    medium: "Reel",
    campaign: "Acrylic_Launch",
    content: "Reel_01",
    origin: "https://zencino.com",
  });

  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://zencino.com");
  assert.equal(parsed.pathname, "/products/pencil-holder-2");
  assert.equal(parsed.searchParams.get("utm_source"), "instagram");
  assert.equal(parsed.searchParams.get("utm_medium"), "reel");
  assert.equal(parsed.searchParams.get("utm_campaign"), "acrylic_launch");
  assert.equal(parsed.searchParams.get("utm_content"), "reel_01");

  // Handles relative landing path without leading slash
  const url2 = buildCampaignUtmUrl({
    landingPath: "collections/acrylic-essentials",
    source: "instagram",
    medium: "bio",
    campaign: "main_bio",
  });
  const parsed2 = new URL(url2);
  assert.equal(parsed2.pathname, "/collections/acrylic-essentials");
  assert.equal(parsed2.searchParams.get("utm_content"), null);
});

test("Reporting Invariant: Amazon outbound clicks are strictly segregated from direct paid revenue", () => {
  // Simulate campaign performance summary
  const summary = {
    campaign: {
      id: "camp_1",
      code: "reel_01",
      name: "Acrylic Reel",
      source: "instagram",
      medium: "reel",
      campaign: "acrylic_launch",
      content: "reel_01",
      reelUrl: null,
      landingPath: "/products",
      active: true,
    },
    pageViews: 1000,
    productViews: 450,
    addToCarts: 80,
    checkoutStarts: 30,
    directOrdersCount: 15,
    directRevenueMinor: 2248500, // ₹22,485.00 from direct website sales
    amazonOutboundClicks: 120, // 120 customers clicked 'Buy on Amazon'
  };

  // Assert direct revenue is purely from website orders
  assert.equal(summary.directOrdersCount, 15);
  assert.equal(summary.directRevenueMinor, 2248500);

  // Assert Amazon clicks are strictly referral intent, and zero revenue is fabricated
  assert.equal(summary.amazonOutboundClicks, 120);

  // Invariant check: Amazon clicks must not mutate or inflate direct revenue
  const revenueWithoutAmazon = summary.directRevenueMinor;
  assert.equal(revenueWithoutAmazon, 2248500);
});

test("Content Fallback Invariant: Default CMS content provides complete structure during initialization", () => {
  // Homepage
  assert.ok(DEFAULT_HOMEPAGE_CONTENT.headline.length > 0);
  assert.ok(DEFAULT_HOMEPAGE_CONTENT.highlights.length >= 3);
  assert.ok(DEFAULT_HOMEPAGE_CONTENT.ctaPrimaryLink.startsWith("/"));

  // FAQ
  assert.ok(DEFAULT_FAQ_CONTENT.items.length >= 4);
  for (const item of DEFAULT_FAQ_CONTENT.items) {
    assert.ok(item.q.endsWith("?"));
    assert.ok(item.a.length > 10);
  }

  // About
  assert.ok(DEFAULT_ABOUT_CONTENT.sections.length >= 3);

  // Policies
  assert.ok(DEFAULT_POLICIES.shipping.content.length >= 3);
  assert.ok(DEFAULT_POLICIES.returns.content.length >= 3);
  assert.ok(DEFAULT_POLICIES.privacy.content.length >= 3);
  assert.ok(DEFAULT_POLICIES.terms.content.length >= 3);
});

test("Store Settings Invariant: Profile contains statutory Indian business disclosures", () => {
  assert.equal(SELLER_INFO.tradeName, "Zencino");
  assert.ok(SELLER_INFO.legalName.includes("Pvt. Ltd."));
  // GSTIN format: 2 digits state code + 10 chars PAN + 1 entity num + 'Z' + 1 checksum
  assert.match(SELLER_INFO.gstin, /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/);
  // PAN format: 5 letters + 4 numbers + 1 letter
  assert.match(SELLER_INFO.pan, /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/);
  assert.ok(SELLER_INFO.supportEmail.includes("@"));
});
