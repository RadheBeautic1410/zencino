import assert from "node:assert/strict";
import test from "node:test";
import { isAmazonProductUrl } from "../lib/catalog/validation";

test("Amazon outbound destination strictly permits only amazon.in URLs", () => {
  // Valid product patterns
  assert.equal(isAmazonProductUrl("https://www.amazon.in/dp/B08XYZ1234"), true);
  assert.equal(isAmazonProductUrl("https://amazon.in/dp/B08XYZ1234/"), true);
  assert.equal(isAmazonProductUrl("https://www.amazon.in/gp/product/B08XYZ1234"), true);

  // Inadmissible URLs
  assert.equal(isAmazonProductUrl("https://amazon.com/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("https://fake-amazon.in/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("http://www.amazon.in/dp/B08XYZ1234"), false);
  assert.equal(isAmazonProductUrl("https://www.amazon.in/"), false);
  assert.equal(isAmazonProductUrl("javascript:alert(1)"), false);
});
