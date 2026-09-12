import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnPath } from "../lib/auth-redirect";

test("only safe internal customer destinations survive", () => {
  assert.equal(safeReturnPath("/account/profile"), "/account/profile");
  assert.equal(safeReturnPath("/products?sort=price"), "/products?sort=price");
  for (const value of [
    null,
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/%2fexample.com",
    "/\nexample.com",
    "/login",
    "/api/auth/sign-out",
  ]) {
    assert.equal(safeReturnPath(value), "/post-auth");
  }
});
