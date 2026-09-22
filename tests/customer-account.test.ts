import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGstBreakdown,
  isPincodeServiceable,
  numberToWordsRupees,
} from "../lib/commerce/rules";

test("calculateGstBreakdown computes statutory intra-state CGST and SGST", () => {
  // Gross ₹1,180.00 (118,000 paise) in Maharashtra (seller state)
  const breakdown = calculateGstBreakdown(
    118_000,
    "Maharashtra",
    "Maharashtra"
  );

  assert.equal(breakdown.isInterState, false);
  // Inclusive tax: 118000 * (0.18 / 1.18) = 18000 paise (₹180)
  assert.equal(breakdown.taxMinor, 18_000);
  assert.equal(breakdown.taxableValueMinor, 100_000); // ₹1,000.00
  assert.equal(breakdown.cgstMinor, 9000); // ₹90.00 (9%)
  assert.equal(breakdown.sgstMinor, 9000); // ₹90.00 (9%)
  assert.equal(breakdown.igstMinor, 0);

  // Invariant: taxable + cgst + sgst == gross
  assert.equal(
    breakdown.taxableValueMinor + breakdown.cgstMinor + breakdown.sgstMinor,
    118_000
  );
});

test("calculateGstBreakdown computes statutory inter-state IGST", () => {
  // Gross ₹1,180.00 (118,000 paise) in Karnataka (inter-state from Maharashtra)
  const breakdown = calculateGstBreakdown(118_000, "Karnataka", "Maharashtra");

  assert.equal(breakdown.isInterState, true);
  assert.equal(breakdown.taxMinor, 18_000);
  assert.equal(breakdown.taxableValueMinor, 100_000);
  assert.equal(breakdown.cgstMinor, 0);
  assert.equal(breakdown.sgstMinor, 0);
  assert.equal(breakdown.igstMinor, 18_000); // 18% IGST

  // Invariant: taxable + igst == gross
  assert.equal(breakdown.taxableValueMinor + breakdown.igstMinor, 118_000);
});

test("numberToWordsRupees produces correct legal wording for invoice amounts", () => {
  assert.equal(
    numberToWordsRupees(1498),
    "One Thousand Four Hundred Ninety-Eight Rupees Only"
  );
  assert.equal(
    numberToWordsRupees(499),
    "Four Hundred Ninety-Nine Rupees Only"
  );
  assert.equal(numberToWordsRupees(25_000), "Twenty-Five Thousand Rupees Only");
  assert.equal(numberToWordsRupees(0), "Zero Rupees Only");
});

test("isPincodeServiceable enforces valid 6-digit Indian PIN codes", () => {
  // Valid Indian postal PINs (Zones 1-9)
  assert.equal(isPincodeServiceable("400064"), true);
  assert.equal(isPincodeServiceable("560001"), true);
  assert.equal(isPincodeServiceable("110001"), true);
  assert.equal(isPincodeServiceable(" 700001 "), true); // trimmed

  // Invalid postal PINs
  assert.equal(isPincodeServiceable("012345"), false); // 0 leading
  assert.equal(isPincodeServiceable("40006"), false); // 5 digits
  assert.equal(isPincodeServiceable("4000640"), false); // 7 digits
  assert.equal(isPincodeServiceable("ABC400"), false);
  assert.equal(isPincodeServiceable(""), false);
});

test("Guest order contact matching logic prevents unauthorized order sniffing", () => {
  const order = {
    orderNumber: "ZNC-20260912-A1B2",
    customerEmail: "priya.sharma@example.com",
    customerPhone: "+91 98765 43210",
  };

  const matchesOrderContact = (inputContact: string) => {
    const clean = inputContact.trim().toLowerCase();
    const cleanDigits = clean.replace(/\D/g, "");

    const matchesEmail = order.customerEmail.toLowerCase() === clean;
    const matchesPhone =
      cleanDigits.length >= 10 &&
      order.customerPhone.replace(/\D/g, "").endsWith(cleanDigits);

    return matchesEmail || matchesPhone;
  };

  // Exact matching email
  assert.equal(matchesOrderContact("priya.sharma@example.com"), true);
  assert.equal(matchesOrderContact("PRIYA.SHARMA@EXAMPLE.COM"), true); // case-insensitive

  // Matching phone numbers (various formats)
  assert.equal(matchesOrderContact("9876543210"), true);
  assert.equal(matchesOrderContact("+91 98765 43210"), true);
  assert.equal(matchesOrderContact("98765-43210"), true);

  // Mismatched attempts (must fail)
  assert.equal(matchesOrderContact("other.user@example.com"), false);
  assert.equal(matchesOrderContact("9876500000"), false);
  assert.equal(matchesOrderContact(""), false);
  assert.equal(matchesOrderContact("43210"), false); // too short (<10 digits)
});
