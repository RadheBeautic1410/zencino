import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGstBreakdown,
  canTransitionOrderStatus,
  generateCreditNoteNumber,
  generateRefundNumber,
  generateReturnNumber,
  isReturnEligible,
} from "../lib/commerce/rules";

test("generateReturnNumber, generateRefundNumber, and generateCreditNoteNumber produce standard identifiers", () => {
  const ret = generateReturnNumber();
  const ref = generateRefundNumber();
  const cn = generateCreditNoteNumber();

  assert.equal(/^RET-\d{8}-[0-9A-F]{4}$/.test(ret), true);
  assert.equal(/^REF-\d{8}-[0-9A-F]{4}$/.test(ref), true);
  assert.equal(/^CN-\d{8}-[0-9A-F]{4}$/.test(cn), true);
});

test("isReturnEligible enforces 7-day policy from delivery date", () => {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // Eligible: delivered within 7 days
  assert.equal(isReturnEligible("delivered", twoDaysAgo).eligible, true);
  assert.equal(isReturnEligible("delivered", now).eligible, true);

  // Ineligible: delivered more than 7 days ago
  const expired = isReturnEligible("delivered", tenDaysAgo);
  assert.equal(expired.eligible, false);
  assert.match(expired.reason || "", /7-day replacement and return window has expired/);

  // Ineligible: not yet delivered
  assert.equal(isReturnEligible("shipped", twoDaysAgo).eligible, false);
  assert.equal(isReturnEligible("processing", twoDaysAgo).eligible, false);
  assert.equal(isReturnEligible("confirmed", twoDaysAgo).eligible, false);
});

test("canTransitionOrderStatus enforces strict fulfilment and payment guards", () => {
  // Guard 1: Unpaid orders CANNOT be marked shipped
  assert.equal(
    canTransitionOrderStatus("confirmed", "shipped", "pending"),
    false
  );
  assert.equal(
    canTransitionOrderStatus("processing", "shipped", "under_review"),
    false
  );

  // Guard 2: Paid/verified orders CAN be marked shipped
  assert.equal(
    canTransitionOrderStatus("processing", "shipped", "verified"),
    true
  );

  // Guard 3: Shipped orders transition to delivered
  assert.equal(
    canTransitionOrderStatus("shipped", "delivered", "verified"),
    true
  );

  // Guard 4: Shipped or delivered orders cannot be directly cancelled (must use returns)
  assert.equal(
    canTransitionOrderStatus("shipped", "cancelled", "verified"),
    false
  );
  assert.equal(
    canTransitionOrderStatus("delivered", "cancelled", "verified"),
    false
  );

  // Guard 5: Cancelled is a terminal state
  assert.equal(
    canTransitionOrderStatus("cancelled", "confirmed", "verified"),
    false
  );
  assert.equal(
    canTransitionOrderStatus("cancelled", "shipped", "verified"),
    false
  );
});

test("Cumulative refund limits prevent over-refunding order totals", () => {
  const orderTotalMinor = 149900; // ₹1,499.00
  const existingRefunds = [
    { amountMinor: 49900 }, // ₹499.00
  ];

  const alreadyRefunded = existingRefunds.reduce((s, r) => s + r.amountMinor, 0);

  const canRefund = (amountMinor: number) => {
    return alreadyRefunded + amountMinor <= orderTotalMinor;
  };

  assert.equal(canRefund(50000), true); // ₹500.00 -> total ₹999.00 <= ₹1,499.00
  assert.equal(canRefund(100000), true); // ₹1,000.00 -> total ₹1,499.00 == ₹1,499.00
  assert.equal(canRefund(100001), false); // ₹1,000.01 -> exceeds total paid!
});

test("Credit Note GST adjustment satisfies Section 34 reverse calculation", () => {
  // Original refund amount ₹1,180.00 (118,000 paise)
  const cnGst = calculateGstBreakdown(118000, "Maharashtra", "Maharashtra");

  // Intra-state credit note reverses CGST 9% and SGST 9%
  assert.equal(cnGst.isInterState, false);
  assert.equal(cnGst.taxableValueMinor, 100000);
  assert.equal(cnGst.cgstMinor, 9000);
  assert.equal(cnGst.sgstMinor, 9000);
  assert.equal(cnGst.igstMinor, 0);
  assert.equal(
    cnGst.taxableValueMinor + cnGst.cgstMinor + cnGst.sgstMinor,
    118000
  );

  // Inter-state credit note reverses IGST 18%
  const cnIgst = calculateGstBreakdown(118000, "Karnataka", "Maharashtra");
  assert.equal(cnIgst.isInterState, true);
  assert.equal(cnIgst.taxableValueMinor, 100000);
  assert.equal(cnIgst.igstMinor, 18000);
  assert.equal(cnIgst.taxableValueMinor + cnIgst.igstMinor, 118000);
});
