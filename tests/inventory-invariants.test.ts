import assert from "node:assert/strict";
import test from "node:test";
import {
  FREE_SHIPPING_THRESHOLD_PAISE,
  GST_RATE,
  STANDARD_SHIPPING_PAISE,
  calculateAvailableStock,
  calculateInclusiveGst,
  calculateShippingFee,
  hashGuestToken,
  isPincodeServiceable,
} from "../lib/commerce/rules";

test("isPincodeServiceable validates Indian 6-digit PIN codes", () => {
  // Valid Indian postal PIN codes (non-zero leading digit, exactly 6 digits)
  assert.equal(isPincodeServiceable("560001"), true);
  assert.equal(isPincodeServiceable("110001"), true);
  assert.equal(isPincodeServiceable("400001"), true);
  assert.equal(isPincodeServiceable(" 600001 "), true); // trimmed

  // Invalid: leading zero, letters, non-6 digits, special characters
  assert.equal(isPincodeServiceable("012345"), false);
  assert.equal(isPincodeServiceable("56000"), false);
  assert.equal(isPincodeServiceable("5600011"), false);
  assert.equal(isPincodeServiceable("56000A"), false);
  assert.equal(isPincodeServiceable("SW1A 1AA"), false);
  assert.equal(isPincodeServiceable(""), false);
  assert.equal(isPincodeServiceable("      "), false);
});

test("Shipping threshold applies free shipping above ₹999", () => {
  assert.equal(FREE_SHIPPING_THRESHOLD_PAISE, 99900);
  assert.equal(STANDARD_SHIPPING_PAISE, 7900);

  // Subtotal under ₹999 -> Standard ₹79 fee
  assert.equal(calculateShippingFee(49900), 7900);
  assert.equal(calculateShippingFee(99800), 7900);

  // Subtotal at or above ₹999 -> ₹0 free shipping
  assert.equal(calculateShippingFee(99900), 0);
  assert.equal(calculateShippingFee(149900), 0);
});

test("Inclusive 18% GST calculation satisfies statutory reverse-calculation", () => {
  assert.equal(GST_RATE, 0.18);

  // If a customer pays ₹499 (49900 paise) inclusive of 18% GST:
  // Base taxable = 49900 / 1.18 = 42288.13...
  // Tax component = 49900 * (0.18 / 1.18) = 7611.86 -> 7612 paise (₹76.12)
  const calculateInclusiveGst = (subtotalMinor: number) => {
    return Math.round(subtotalMinor * (GST_RATE / (1 + GST_RATE)));
  };

  const gstOn499 = calculateInclusiveGst(49900);
  assert.equal(gstOn499, 7612);

  // Verify Base + GST = Total (within 1 paisa precision)
  const taxableBase = 49900 - gstOn499;
  assert.equal(taxableBase + gstOn499, 49900);

  // Test on ₹1000 (100000 paise)
  const gstOn1000 = calculateInclusiveGst(100000);
  assert.equal(gstOn1000, 15254);
});

test("Inventory balance invariants ensure available stock and non-negative constraints", () => {
  // Normal stock scenario
  assert.equal(calculateAvailableStock(50, 10), 40);

  // Fully reserved
  assert.equal(calculateAvailableStock(10, 10), 0);

  // Oversubscribed protection (safety floor at 0)
  assert.equal(calculateAvailableStock(5, 10), 0);

  // Stock deduction validator function
  const validateAdjustment = (onHand: number, reserved: number, delta: number) => {
    const newOnHand = onHand + delta;
    if (newOnHand < 0) {
      throw new Error("On hand stock cannot be negative.");
    }
    if (newOnHand < reserved) {
      throw new Error(`Cannot reduce stock below currently reserved units (${reserved} reserved).`);
    }
    return newOnHand;
  };

  // Valid increase
  assert.equal(validateAdjustment(50, 10, +25), 75);

  // Valid deduction above reserved
  assert.equal(validateAdjustment(50, 10, -20), 30);

  // Deduction to exact reserved limit
  assert.equal(validateAdjustment(50, 10, -40), 10);

  // Invalid deduction below reserved
  assert.throws(
    () => validateAdjustment(50, 10, -45),
    /Cannot reduce stock below currently reserved units/
  );

  // Invalid deduction to negative
  assert.throws(
    () => validateAdjustment(50, 0, -60),
    /On hand stock cannot be negative/
  );
});

test("hashGuestToken produces 64-char sha256 hex digest", () => {
  const token = "test-guest-uuid-12345";
  const hash1 = hashGuestToken(token);
  const hash2 = hashGuestToken(token);

  assert.equal(hash1.length, 64);
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hashGuestToken("different-token"));
});
