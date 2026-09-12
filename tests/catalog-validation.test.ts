import assert from "node:assert/strict";
import test from "node:test";
import {
  isAmazonProductUrl,
  optionSignature,
  productInput,
  variantInput,
} from "../lib/catalog/validation";

test("isAmazonProductUrl accepts only valid Amazon India product URLs", () => {
  assert.equal(
    isAmazonProductUrl("https://www.amazon.in/dp/B08XYZ1234"),
    true
  );
  assert.equal(
    isAmazonProductUrl("https://amazon.in/gp/product/B08XYZ1234"),
    true
  );

  // Invalid: other domains, missing ASIN, http, malicious credentials
  assert.equal(isAmazonProductUrl("https://www.amazon.com/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("http://www.amazon.in/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("https://user:pass@www.amazon.in/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("https://www.amazon.in/s?k=pencil+holder"), false);
  assert.equal(isAmazonProductUrl("not-a-url"), false);
});

test("optionSignature produces deterministic sorted JSON array representation", () => {
  const sig1 = optionSignature({ Size: "Large", Color: "Clear" });
  const sig2 = optionSignature({ Color: "Clear", Size: "Large" });
  assert.equal(sig1, sig2);
  assert.equal(sig1, JSON.stringify([["Color", "Clear"], ["Size", "Large"]]));

  const emptySig = optionSignature({});
  assert.equal(emptySig, "[]");
});

test("variantInput enforces pricing and delivery rules", () => {
  // Valid variant with website channel
  const validWeb = variantInput.safeParse({
    sku: "ZNC-CLR-01",
    title: "Clear Standard",
    options: { Color: "Clear" },
    priceMinor: 49900,
    mrpMinor: 69900,
    weightG: 350,
    lengthMm: 150,
    widthMm: 100,
    heightMm: 100,
    active: true,
    websiteEnabled: true,
    amazonEnabled: false,
    amazonUrl: "",
  });
  assert.equal(validWeb.success, true);

  // Rejects websiteEnabled without positive price
  const missingPrice = variantInput.safeParse({
    sku: "ZNC-CLR-02",
    title: "Clear No Price",
    options: {},
    priceMinor: null,
    mrpMinor: null,
    weightG: 350,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    active: true,
    websiteEnabled: true,
    amazonEnabled: false,
    amazonUrl: "",
  });
  assert.equal(missingPrice.success, false);

  // Rejects MRP lower than selling price
  const invalidMrp = variantInput.safeParse({
    sku: "ZNC-CLR-03",
    title: "Bad MRP",
    options: {},
    priceMinor: 50000,
    mrpMinor: 40000,
    weightG: 300,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    active: true,
    websiteEnabled: true,
    amazonEnabled: false,
    amazonUrl: "",
  });
  assert.equal(invalidMrp.success, false);

  // Rejects amazonEnabled with invalid URL
  const invalidAmazon = variantInput.safeParse({
    sku: "ZNC-CLR-04",
    title: "Bad Amazon Link",
    options: {},
    priceMinor: 50000,
    mrpMinor: 60000,
    weightG: 300,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    active: true,
    websiteEnabled: false,
    amazonEnabled: true,
    amazonUrl: "https://amazon.com/dp/B08XYZ1234",
  });
  assert.equal(invalidAmazon.success, false);
});

test("productInput rejects duplicate SKUs or duplicate option signatures", () => {
  const duplicateSku = productInput.safeParse({
    name: "Acrylic Pencil Holder",
    slug: "acrylic-pencil-holder",
    description: "Nice holder",
    primaryCategoryId: "cat_123",
    specifications: {},
    care: "",
    packageContents: "",
    seoTitle: "",
    seoDescription: "",
    variants: [
      {
        sku: "ZNC-01",
        title: "V1",
        options: { Color: "Clear" },
        priceMinor: 10000,
        mrpMinor: null,
        weightG: 200,
        lengthMm: null,
        widthMm: null,
        heightMm: null,
        active: true,
        websiteEnabled: true,
        amazonEnabled: false,
        amazonUrl: "",
      },
      {
        sku: "znc-01", // duplicate case-insensitive
        title: "V2",
        options: { Color: "Frosted" },
        priceMinor: 12000,
        mrpMinor: null,
        weightG: 200,
        lengthMm: null,
        widthMm: null,
        heightMm: null,
        active: true,
        websiteEnabled: true,
        amazonEnabled: false,
        amazonUrl: "",
      },
    ],
  });
  assert.equal(duplicateSku.success, false);
});
