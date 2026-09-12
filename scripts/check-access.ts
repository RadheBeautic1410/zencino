import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { directPgConnectionString } from "../lib/pg-connection";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  const base = process.env.TEST_APP_URL || "http://localhost:3001";
  const origin = new URL(base);
  assert.ok(
    ["localhost", "127.0.0.1"].includes(origin.hostname),
    "Only a local server may be tested"
  );
  const connection =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const secret = process.env.APP_SECRET;
  assert.ok(connection && secret, "Database and app secret required");
  const sql = postgres(directPgConnectionString(connection), { max: 1 });
  const id = `access-check-${randomUUID()}`;
  const token = randomUUID();
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  const cookie = `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
  const get = async (path: string, authenticated = false) => {
    const response = await fetch(`${base}${path}`, {
      redirect: "manual",
      headers: authenticated ? { cookie } : {},
    });
    const body = await response.clone().text();
    const responseHeaders = new Headers(response.headers);
    // App Router can stream the loading boundary before emitting a redirect.
    const streamedRedirect = body.match(/<meta[^>]+content="\d+;url=([^"]+)"/);
    if (!responseHeaders.has("location") && streamedRedirect) {
      responseHeaders.set(
        "location",
        streamedRedirect[1].replaceAll("&amp;", "&")
      );
    }
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  };
  try {
    await sql`INSERT INTO "user" (id, email, name, email_verified) VALUES (${id}, ${`${id}@example.invalid`}, 'Access check', true)`;
    await sql`INSERT INTO session (id, user_id, token, expires_at) VALUES (${randomUUID()}, ${id}, ${token}, ${new Date(Date.now() + 300_000)})`;
    assert.equal((await get("/")).status, 200);
    assert.equal((await get("/", true)).status, 200);
    assert.equal((await get("/account")).headers.get("location"), "/login");
    assert.equal((await get("/admin")).headers.get("location"), "/login");
    assert.equal((await get("/account", true)).status, 200);
    assert.equal(
      (await get("/admin", true)).headers.get("location"),
      "/account"
    );
    assert.equal(
      (await get("/orbit/users")).headers.get("location"),
      "/admin/users"
    );
    assert.equal(
      (await get("/dashboard/profile")).headers.get("location"),
      "/account/profile"
    );
    const exportResponse = await get("/api/account/export", true);
    assert.equal(exportResponse.status, 200);
    assert.ok((await exportResponse.text()).includes(id));
    await sql`UPDATE "user" SET role = 'admin' WHERE id = ${id}`;
    assert.equal((await get("/admin", true)).status, 200);
    await sql`UPDATE "user" SET role = 'user' WHERE id = ${id}`;
    assert.equal(
      (await get("/admin", true)).headers.get("location"),
      "/account"
    );
    await sql`UPDATE "user" SET banned = true WHERE id = ${id}`;
    const banned = await get("/account", true);
    assert.ok(banned.headers.get("location")?.startsWith("/login"));
    await sql`DELETE FROM session WHERE user_id = ${id}`;
    assert.equal(
      (await get("/account", true)).headers.get("location"),
      "/login"
    );
    console.log(
      "Access checks passed: public browsing, customer/owner separation, fresh roles, bans, revoked sessions, private export and legacy redirects."
    );
  } finally {
    await sql`DELETE FROM "user" WHERE id = ${id}`;
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof assert.AssertionError
      ? `Access assertion failed: expected ${error.expected}, received ${error.actual}`
      : "Access check failed; inspect local server readiness."
  );
  process.exitCode = 1;
});
