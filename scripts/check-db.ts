import { existsSync } from "node:fs";
import postgres from "postgres";
import { directPgConnectionString } from "../lib/pg-connection";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  const connection = process.env.DATABASE_URL;
  if (!connection) {
    throw new Error("DATABASE_URL is missing");
  }
  const sql = postgres(
    directPgConnectionString(process.env.DATABASE_URL_UNPOOLED || connection),
    {
      max: 1,
      connect_timeout: 15,
    }
  );
  try {
    await sql`SELECT 1 AS connected`;
    const tables =
      await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    console.log("Database connection verified (read-only).");
    console.log(
      "Public tables:",
      tables.map((table) => table.tablename).join(", ") || "none"
    );
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
    `Database verification failed (code: ${code}). Check connection configuration and network access.`
  );
  process.exitCode = 1;
});
