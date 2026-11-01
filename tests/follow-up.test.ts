import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPaymentReminderText,
  buildWhatsAppUrl,
  toWhatsAppNumber,
} from "../lib/commerce/follow-up";

test("Indian mobile numbers normalise to wa.me form", () => {
  assert.equal(toWhatsAppNumber("9876543210"), "919876543210");
  assert.equal(toWhatsAppNumber("+91 98765 43210"), "919876543210");
  assert.equal(toWhatsAppNumber("09876543210"), "919876543210");
  assert.equal(toWhatsAppNumber("919876543210"), "919876543210");
  for (const bad of ["", "12345", "1234567890", "+1 415 555 0100"]) {
    assert.equal(toWhatsAppNumber(bad), null, bad);
  }
});

test("payment reminder names the order, first item and total", () => {
  const text = buildPaymentReminderText({
    customerName: "Arun Kumar",
    orderNumber: "ZN-1001",
    totalMinor: 31_000,
    itemNames: ["Acrylic Mobile Stand", "Pen Holder"],
  });
  assert.match(text, /^Hi Arun,/);
  assert.match(text, /ZN-1001 for Acrylic Mobile Stand \+ 1 more \(₹310\)/);
});

test("WhatsApp link encodes the message and skips unusable numbers", () => {
  assert.equal(
    buildWhatsAppUrl("9876543210", "Hi & bye"),
    "https://wa.me/919876543210?text=Hi%20%26%20bye"
  );
  assert.equal(buildWhatsAppUrl("123", "Hi"), null);
});
