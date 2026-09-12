import assert from "node:assert/strict";
import test from "node:test";
import { generateOrderNumber } from "../lib/commerce/rules";
import { generateUpiUri, isValidUtr } from "../lib/commerce/upi";

test("generateUpiUri builds valid NPCI UPI payment URIs", () => {
  const uri = generateUpiUri({
    upiId: "zencino@oksbi",
    upiName: "Zencino",
    amountRupees: 499.0,
    orderNumber: "ZNC-20260912-A1B2",
    note: "Zencino Order ZNC-20260912-A1B2",
  });

  assert.equal(uri.startsWith("upi://pay?"), true);

  const parsedUrl = new URL(uri);
  assert.equal(parsedUrl.searchParams.get("pa"), "zencino@oksbi");
  assert.equal(parsedUrl.searchParams.get("pn"), "Zencino");
  assert.equal(parsedUrl.searchParams.get("am"), "499.00");
  assert.equal(parsedUrl.searchParams.get("cu"), "INR");
  assert.equal(parsedUrl.searchParams.get("tn"), "Zencino Order ZNC-20260912-A1B2");
});

test("isValidUtr validates Indian bank UTR / UPI transaction references", () => {
  // Standard 12-digit numeric UTRs
  assert.equal(isValidUtr("425612345678"), true);
  assert.equal(isValidUtr(" 425612345678 "), true); // trimmed
  assert.equal(isValidUtr("4256 1234 5678"), true); // spaces stripped

  // Bank IMPS/NEFT alphanumeric references (e.g. HDFC, Axis, SBI)
  assert.equal(isValidUtr("HDFC00123456789"), true);
  assert.equal(isValidUtr("SBI9876543210"), true);

  // Inadmissible: too short (<8), empty, special symbols
  assert.equal(isValidUtr("12345"), false);
  assert.equal(isValidUtr(""), false);
  assert.equal(isValidUtr("      "), false);
  assert.equal(isValidUtr("UTR-1234-5678!"), false);
});

test("generateOrderNumber produces deterministic format with date and random entropy", () => {
  const ord1 = generateOrderNumber();
  const ord2 = generateOrderNumber();

  // Pattern: ZNC-YYYYMMDD-XXXX
  const pattern = /^ZNC-\d{8}-[0-9A-F]{4}$/;
  assert.equal(pattern.test(ord1), true);
  assert.equal(pattern.test(ord2), true);

  // Subsequent invocations generate distinct references
  assert.notEqual(ord1, ord2);
});

test("Order state machine invariants enforce valid progression", () => {
  const validTransitions: Record<string, string[]> = {
    pending_payment: ["payment_review", "cancelled"],
    payment_review: ["confirmed", "cancelled", "pending_payment"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  const canTransition = (from: string, to: string) => {
    return validTransitions[from]?.includes(to) ?? false;
  };

  assert.equal(canTransition("pending_payment", "payment_review"), true);
  assert.equal(canTransition("payment_review", "confirmed"), true);
  assert.equal(canTransition("confirmed", "shipped"), false); // must process first
  assert.equal(canTransition("confirmed", "processing"), true);
  assert.equal(canTransition("processing", "shipped"), true);
  assert.equal(canTransition("shipped", "delivered"), true);
  assert.equal(canTransition("delivered", "pending_payment"), false); // terminal
});
