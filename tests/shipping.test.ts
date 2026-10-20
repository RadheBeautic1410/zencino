import assert from "node:assert/strict";
import test from "node:test";
import {
  billableWeightKg,
  calculateOrderTotals,
  calculateWeightShipping,
  findShippingRate,
  type ShippingRateRule,
  totalCartWeightG,
  validateShippingPincodePattern,
} from "../lib/commerce/rules";

const rates: ShippingRateRule[] = [
  { pincode: "36****", type: "wildcard", rateMinor: 5000 },
  { pincode: "3640**", type: "wildcard", rateMinor: 4500 },
  { pincode: "364001-364005", type: "range", rateMinor: 4000 },
  { pincode: "364002", type: "exact", rateMinor: 3000 },
];

test("shipping rate priority is exact, then range, then longest wildcard", () => {
  assert.equal(findShippingRate(rates, "364002")?.rateMinor, 3000);
  assert.equal(findShippingRate(rates, "364004")?.rateMinor, 4000);
  assert.equal(findShippingRate(rates, "364050")?.rateMinor, 4500);
  assert.equal(findShippingRate(rates, "369999")?.rateMinor, 5000);
  assert.equal(findShippingRate(rates, "110001"), null);
  assert.equal(findShippingRate(rates, "3640"), null);
});

test("weight is billed in whole kg, minimum 1 kg", () => {
  assert.equal(billableWeightKg(0), 1);
  assert.equal(billableWeightKg(1000), 1);
  assert.equal(billableWeightKg(1001), 2);
  assert.equal(calculateWeightShipping(2300, 4000), 12_000);
  assert.equal(
    totalCartWeightG([
      { quantity: 2, weightG: 500 },
      { quantity: 1, weightG: null },
    ]),
    1300
  );
});

test("pincode pattern validation", () => {
  assert.deepEqual(validateShippingPincodePattern("364001"), {
    ok: true,
    type: "exact",
  });
  assert.equal(validateShippingPincodePattern("36****").ok, true);
  assert.equal(validateShippingPincodePattern("364001-364005").ok, true);
  assert.equal(validateShippingPincodePattern("364005-364001").ok, false);
  assert.equal(validateShippingPincodePattern("36*").ok, true);
  assert.equal(validateShippingPincodePattern("*").ok, false);
  assert.equal(validateShippingPincodePattern("1234567*").ok, false);
  assert.equal(validateShippingPincodePattern("12345").ok, false);
});

test("order totals use the weight based charge unless free threshold is met", () => {
  assert.equal(calculateOrderTotals(50_000, 0, 12_000).shippingMinor, 12_000);
  assert.equal(calculateOrderTotals(99_900, 0, 12_000).shippingMinor, 0);
  assert.equal(calculateOrderTotals(99_900, 5000, 12_000).shippingMinor, 12_000);
  assert.equal(calculateOrderTotals(50_000).shippingMinor, 7900);
});
