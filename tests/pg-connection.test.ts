import assert from "node:assert/strict";
import test from "node:test";
import { directPgConnectionString } from "../lib/pg-connection";

test("Neon direct connection preserves credentials, database and TLS parameters", () => {
  const input =
    "postgres://user:p%40ss@ep-example-pooler.us-east-2.aws.neon.tech/shop?sslmode=require&channel_binding=require";
  const result = new URL(directPgConnectionString(input));
  assert.equal(result.hostname, "ep-example.us-east-2.aws.neon.tech");
  assert.equal(result.password, "p%40ss");
  assert.equal(result.pathname, "/shop");
  assert.equal(result.searchParams.get("sslmode"), "require");
  assert.equal(result.searchParams.get("channel_binding"), "require");
});

test("non-Neon pooler names are not rewritten", () => {
  const input = "postgresql://user:pass@custom-pooler.example.com/shop";
  assert.equal(directPgConnectionString(input), input);
});

test("direct Neon and local URLs remain direct", () => {
  for (const input of [
    "postgresql://user:pass@localhost:5432/shop",
    "postgresql://user:pass@ep-example.aws.neon.tech/shop",
  ]) {
    assert.equal(directPgConnectionString(input), input);
  }
});
