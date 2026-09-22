import assert from "node:assert/strict";
import test from "node:test";
import { SELLER_INFO } from "../config/platform";
import { isAmazonProductUrl } from "../lib/catalog/validation";
import { DEFAULT_POLICIES } from "../lib/commerce/content-defaults";
import {
  buildCampaignUtmUrl,
  calculateGstBreakdown,
  calculateShippingFee,
  generateCreditNoteNumber,
  generateOrderNumber,
  generateRefundNumber,
  generateReturnNumber,
  generateSupportTicketNumber,
  isPincodeServiceable,
  isReturnEligible,
  numberToWordsRupees,
} from "../lib/commerce/rules";
import {
  checkRateLimit,
  resetRateLimitStore,
} from "../lib/security/rate-limit";
import { redactSensitiveData } from "../lib/security/redact";

test("Launch Invariant: Rate limiting enforces threshold and window reset", () => {
  resetRateLimitStore();

  const config = { maxRequests: 3, windowMs: 1000 };
  const client = "test-client-1";
  const route = "test-route";

  const res1 = checkRateLimit(client, route, config);
  assert.equal(res1.success, true);
  assert.equal(res1.remaining, 2);

  const res2 = checkRateLimit(client, route, config);
  assert.equal(res2.success, true);
  assert.equal(res2.remaining, 1);

  const res3 = checkRateLimit(client, route, config);
  assert.equal(res3.success, true);
  assert.equal(res3.remaining, 0);

  // 4th request exceeds threshold
  const res4 = checkRateLimit(client, route, config);
  assert.equal(res4.success, false);
  assert.equal(res4.remaining, 0);
  assert.ok(res4.resetMs > 0);

  // Reset store
  resetRateLimitStore();
  const res5 = checkRateLimit(client, route, config);
  assert.equal(res5.success, true);
  assert.equal(res5.remaining, 2);
});

test("Launch Invariant: Sensitive operational data is scrubbed before logging", () => {
  const dirtyObject = {
    userEmail: "customer@example.com",
    password: "super-secret-password-123",
    authToken: "bearer-token-xyz-789",
    databaseUrl:
      "postgresql://postgres:secret_pass@ep-cool-123.neon.tech/neondb?sslmode=require",
    cardDetails: {
      cardNumber: "4111 2222 3333 4444",
      cvv: "123",
    },
    orderTotalMinor: 149_900,
  };

  const clean = redactSensitiveData(dirtyObject);

  assert.equal(clean.userEmail, "customer@example.com");
  assert.equal(clean.orderTotalMinor, 149_900);
  assert.equal(clean.password, "[REDACTED]");
  assert.equal(clean.authToken, "[REDACTED]");
  assert.equal(clean.cardDetails.cvv, "[REDACTED]");
  assert.ok(!clean.databaseUrl.includes("secret_pass"));
  assert.ok(clean.databaseUrl.includes("[REDACTED]"));
  assert.ok(!clean.cardDetails.cardNumber.includes("4111 2222"));
});

test("Launch Invariant: Multi-category SKU naming conventions & Amazon destinations", () => {
  const onboardedSkus = [
    {
      sku: "ZNC-ORG-2C-1P",
      amazonUrl: "https://www.amazon.in/dp/B08XYZ1234",
      price: 49_900,
      mrp: 79_900,
    },
    {
      sku: "ZNC-ORG-2C-2P",
      amazonUrl: "https://www.amazon.in/dp/B08XYZ5678",
      price: 89_900,
      mrp: 149_900,
    },
    {
      sku: "ZNC-DSK-RISER-CLR",
      amazonUrl: "https://www.amazon.in/dp/B09MNT9012",
      price: 129_900,
      mrp: 199_900,
    },
    {
      sku: "ZNC-VAN-ROT-CLR",
      amazonUrl: "https://www.amazon.in/dp/B09ROT3456",
      price: 149_900,
      mrp: 229_900,
    },
    {
      sku: "ZNC-SHF-FLT-2P",
      amazonUrl: "https://www.amazon.in/dp/B09SHF7890",
      price: 89_900,
      mrp: 139_900,
    },
    {
      sku: "ZNC-KIT-MAG-40CM",
      amazonUrl: "https://www.amazon.in/dp/B09MAG1122",
      price: 119_900,
      mrp: 179_900,
    },
  ];

  for (const item of onboardedSkus) {
    // Validate SKU format
    assert.match(item.sku, /^ZNC-[A-Z0-9-]+$/);
    // Validate pricing
    assert.ok(item.price > 0);
    assert.ok(item.mrp >= item.price);
    // Validate Amazon outbound destination
    assert.equal(isAmazonProductUrl(item.amazonUrl), true);
  }
});

test("Launch Invariant: Indian E-Commerce Shipping fee & Pincode serviceability", () => {
  // Serviceable PIN codes (Indian 6-digit postal zones 1-9)
  assert.equal(isPincodeServiceable("400001"), true); // Mumbai
  assert.equal(isPincodeServiceable("110001"), true); // Delhi
  assert.equal(isPincodeServiceable("560001"), true); // Bengaluru
  assert.equal(isPincodeServiceable("012345"), false); // Invalid leading 0
  assert.equal(isPincodeServiceable("1234"), false); // Too short
  assert.equal(isPincodeServiceable("ABCDEF"), false); // Non-numeric

  // Free shipping threshold at ₹999 (99900 minor)
  assert.equal(calculateShippingFee(49_900), 7900); // ₹499 -> ₹79 shipping
  assert.equal(calculateShippingFee(89_900), 7900); // ₹899 -> ₹79 shipping
  assert.equal(calculateShippingFee(99_900), 0); // ₹999 -> ₹0 free shipping
  assert.equal(calculateShippingFee(149_900), 0); // ₹1,499 -> ₹0 free shipping
});

test("Launch Invariant: Statutory GST invoice calculation (CGST/SGST vs IGST)", () => {
  // Intra-state order in Maharashtra (Place of supply: Maharashtra)
  const intra = calculateGstBreakdown(11_800, "Maharashtra", "Maharashtra");
  assert.equal(intra.taxableValueMinor, 10_000);
  assert.equal(intra.taxMinor, 1800);
  assert.equal(intra.cgstMinor, 900); // 9%
  assert.equal(intra.sgstMinor, 900); // 9%
  assert.equal(intra.igstMinor, 0);

  // Inter-state order from Maharashtra to Karnataka
  const inter = calculateGstBreakdown(11_800, "Karnataka", "Maharashtra");
  assert.equal(inter.taxableValueMinor, 10_000);
  assert.equal(inter.taxMinor, 1800);
  assert.equal(inter.cgstMinor, 0);
  assert.equal(inter.sgstMinor, 0);
  assert.equal(inter.igstMinor, 1800); // 18%

  // Legal amount in words
  const words = numberToWordsRupees(Math.floor(11_800 / 100));
  assert.equal(words, "One Hundred Eighteen Rupees Only");
});

test("Launch Invariant: Full standard reference identifiers", () => {
  assert.match(generateOrderNumber(), /^ZNC-\d{8}-[A-Z0-9]{4}$/);
  assert.match(generateReturnNumber(), /^RET-\d{8}-[A-Z0-9]{4}$/);
  assert.match(generateRefundNumber(), /^REF-\d{8}-[A-Z0-9]{4}$/);
  assert.match(generateCreditNoteNumber(), /^CN-\d{8}-[A-Z0-9]{4}$/);
  assert.match(generateSupportTicketNumber(), /^SUP-\d{8}-[A-Z0-9]{4}$/);
});

test("Launch Invariant: 7-Day return eligibility policy", () => {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000 + 1000);
  const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000);

  assert.equal(isReturnEligible("delivered", threeDaysAgo).eligible, true);
  assert.equal(isReturnEligible("delivered", sevenDaysAgo).eligible, true);
  assert.equal(isReturnEligible("delivered", eightDaysAgo).eligible, false);
  assert.equal(isReturnEligible("processing", threeDaysAgo).eligible, false);
});

test("Launch Invariant: Statutory store profile & statutory policies", () => {
  // Disclosures
  assert.equal(SELLER_INFO.gstin, "27AAACZ1234A1Z5");
  assert.equal(SELLER_INFO.pan, "AAACZ1234A");
  assert.equal(SELLER_INFO.stateCode, "27");
  assert.equal(SELLER_INFO.country, "India");

  // Policies
  assert.ok(DEFAULT_POLICIES.shipping.content.length > 0);
  assert.ok(DEFAULT_POLICIES.returns.content.length > 0);
  assert.ok(DEFAULT_POLICIES.privacy.content.length > 0);
  assert.ok(DEFAULT_POLICIES.terms.content.length > 0);
});

test("Launch Invariant: Instagram UTM link generator round-trip", () => {
  const url = buildCampaignUtmUrl({
    landingPath: "/products/acrylic-desk-organizer-2-compartment",
    source: "instagram",
    medium: "reel_bio",
    campaign: "acrylic_launch",
    content: "desk_makeover_reel",
    origin: "https://zencino.com",
  });

  assert.ok(url.includes("utm_source=instagram"));
  assert.ok(url.includes("utm_medium=reel_bio"));
  assert.ok(url.includes("utm_campaign=acrylic_launch"));
  assert.ok(url.includes("utm_content=desk_makeover_reel"));
});
