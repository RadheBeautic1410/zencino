import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateDiscount,
  type CouponRule,
  calculateOrderTotals,
  evaluateCoupon,
  normalizeCouponCode,
} from "../lib/commerce/rules";

const base: CouponRule = {
  active: true,
  discountType: "percent",
  discountValue: 10,
  expiresAt: null,
  maxDiscountMinor: null,
  minOrderMinor: 0,
  startsAt: null,
};

test("normalizeCouponCode uppercases and strips invalid characters", () => {
  assert.equal(normalizeCouponCode(" welcome 10! "), "WELCOME10");
  assert.equal(normalizeCouponCode("save-20_x"), "SAVE-20_X");
});

test("percent coupon is floored and respects the max discount cap", () => {
  const plain = evaluateCoupon(base, 99_950);
  assert.deepEqual(plain, { ok: true, discountMinor: 9995 });

  const capped = evaluateCoupon({ ...base, maxDiscountMinor: 5000 }, 99_950);
  assert.deepEqual(capped, { ok: true, discountMinor: 5000 });
});

test("fixed coupon never exceeds the subtotal", () => {
  const coupon: CouponRule = {
    ...base,
    discountType: "fixed",
    discountValue: 50_000,
  };
  assert.deepEqual(evaluateCoupon(coupon, 30_000), {
    ok: true,
    discountMinor: 30_000,
  });
});

test("inactive, expired, not-started and under-minimum coupons are rejected", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  assert.equal(
    evaluateCoupon({ ...base, active: false }, 10_000, now).ok,
    false
  );
  assert.equal(
    evaluateCoupon(
      { ...base, expiresAt: new Date("2026-06-01T00:00:00Z") },
      10_000,
      now
    ).ok,
    false
  );
  assert.equal(
    evaluateCoupon(
      { ...base, startsAt: new Date("2026-07-01T00:00:00Z") },
      10_000,
      now
    ).ok,
    false
  );
  assert.equal(
    evaluateCoupon({ ...base, minOrderMinor: 50_000 }, 10_000, now).ok,
    false
  );
});

test("order totals apply the discount to subtotal before shipping and GST", () => {
  // ₹1,000 cart, 10% off -> ₹900 which is below the free-shipping threshold
  const totals = calculateOrderTotals(100_000, 10_000);
  assert.equal(totals.shippingMinor, 7900);
  assert.equal(totals.totalMinor, 90_000 + 7900);
  assert.equal(totals.taxMinor, Math.round(90_000 * (0.18 / 1.18)));

  // No discount keeps free shipping
  const full = calculateOrderTotals(100_000, 0);
  assert.equal(full.shippingMinor, 0);
  assert.equal(full.totalMinor, 100_000);
});

test("allocateDiscount spreads the discount over eligible lines only", () => {
  const shares = allocateDiscount(
    [
      { eligible: true, lineTotalMinor: 30_000 },
      { eligible: false, lineTotalMinor: 50_000 },
      { eligible: true, lineTotalMinor: 10_000 },
    ],
    1000
  );
  assert.deepEqual(shares, [750, 0, 250]);
  assert.equal(
    shares.reduce((a, b) => a + b, 0),
    1000
  );
});

test("allocateDiscount keeps the exact total with awkward rounding", () => {
  const shares = allocateDiscount(
    [
      { eligible: true, lineTotalMinor: 3333 },
      { eligible: true, lineTotalMinor: 3333 },
      { eligible: true, lineTotalMinor: 3334 },
    ],
    1000
  );
  assert.equal(
    shares.reduce((a, b) => a + b, 0),
    1000
  );
  assert.equal(
    shares.every((s) => s >= 0),
    true
  );
});
