import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { directPgConnectionString } from "./lib/pg-connection";

if (existsSync(".env")) {
  process.loadEnvFile();
}

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for migrations");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: directPgConnectionString(connectionString),
  },
});
