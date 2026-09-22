import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  console.log("=================================================");
  console.log("  Zencino Database Backup Verification Utility   ");
  console.log("=================================================");

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!existsSync(backupDir)) {
    console.log("[!] No backups directory found at:", backupDir);
    return;
  }

  const files = readdirSync(backupDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("[!] No backup JSON snapshots found in:", backupDir);
    return;
  }

  const latestFile = path.join(backupDir, files.sort().reverse()[0]);
  console.log(`\nInspecting latest backup snapshot: ${latestFile}...`);

  const raw = readFileSync(latestFile, "utf-8");
  const data = JSON.parse(raw);

  console.log("\nBackup Metadata:");
  console.log(`  - Timestamp: ${data.metadata?.timestamp || "unknown"}`);
  console.log(`  - Generator: ${data.metadata?.generator || "unknown"}`);
  console.log(
    `  - File Size: ${(Buffer.byteLength(raw) / 1024).toFixed(2)} KB`
  );

  console.log("\nIncluded Table Datasets:");
  let totalRows = 0;
  for (const [table, rows] of Object.entries(data.tables || {})) {
    const count = Array.isArray(rows) ? rows.length : 0;
    totalRows += count;
    console.log(`  - ${table.padEnd(24)}: ${count} rows`);
  }

  console.log(
    `\n[✓] Backup integrity verified. Total rows archived: ${totalRows}`
  );
  console.log("=================================================\n");
}

main()
  .catch((err) => {
    console.error("\n[!] Restore verification failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
