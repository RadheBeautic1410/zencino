import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { directPgConnectionString } from "../lib/pg-connection";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  const connection =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connection) {
    throw new Error("DATABASE_URL is required");
  }
  const sql = postgres(directPgConnectionString(connection), { max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "./db/migrations" });
    console.log("Versioned database migrations applied successfully.");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : "unknown";
  console.error(
    `Migration failed (code: ${code}); inspect configuration and migration history. No reset was performed.`
  );
  process.exitCode = 1;
});
