/**
 * One-off import of PIN shipping rates exported from the RadheBeautic admin
 * (`shipping_rates` collection, rupees per kg) into `shipping_pincode_rates`.
 *
 *   tsx --env-file=.env scripts/import-shipping-rates.ts <export.json>          # dry run
 *   tsx --env-file=.env scripts/import-shipping-rates.ts <export.json> --apply  # write
 *
 * Only reads the JSON file and writes to the Zencino database.
 */
import { readFileSync } from "node:fs";
import { inArray } from "drizzle-orm";
import { shippingPincodeRates } from "../db/schema/shipping";
import { db } from "../lib/db";
import {
  determineShippingPincodeType,
  validateShippingPincodePattern,
} from "../lib/commerce/rules";

interface SourceRate {
  createdAt: string;
  description?: string | null;
  isActive: boolean;
  pincode: string;
  rate: number;
  updatedAt: string;
}

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!file) {
    throw new Error("Usage: import-shipping-rates.ts <export.json> [--apply]");
  }
  const source = JSON.parse(readFileSync(file, "utf8")) as SourceRate[];

  // Source type can be wrong (a range stored as "wildcard"): derive from pattern.
  // Duplicate patterns: the most recently updated one wins.
  const byPattern = new Map<string, SourceRate>();
  const conflicts: string[] = [];
  for (const row of source) {
    const pincode = row.pincode.trim();
    const prev = byPattern.get(pincode);
    if (prev) {
      if (prev.rate !== row.rate) {
        conflicts.push(`${pincode}: ${prev.rate} vs ${row.rate}`);
      }
      if (new Date(row.updatedAt) <= new Date(prev.updatedAt)) {
        continue;
      }
    }
    byPattern.set(pincode, { ...row, pincode });
  }

  const skipped: string[] = [];
  const rows = [];
  for (const [pincode, row] of byPattern) {
    const check = validateShippingPincodePattern(pincode);
    if (!check.ok) {
      skipped.push(`${pincode}: ${check.error}`);
      continue;
    }
    rows.push({
      pincode,
      type: determineShippingPincodeType(pincode),
      rateMinor: Math.round(row.rate * 100),
      description: row.description?.trim() || null,
      active: row.isActive,
    });
  }

  const existing = await db
    .select({ pincode: shippingPincodeRates.pincode })
    .from(shippingPincodeRates)
    .where(
      inArray(
        shippingPincodeRates.pincode,
        rows.map((r) => r.pincode)
      )
    );
  const existingSet = new Set(existing.map((e) => e.pincode));
  const toInsert = rows.filter((r) => !existingSet.has(r.pincode));

  console.log(`source rows:        ${source.length}`);
  console.log(`unique patterns:    ${byPattern.size}`);
  console.log(`already in Zencino: ${existingSet.size} (skipped)`);
  console.log(`to insert:          ${toInsert.length}`);
  if (conflicts.length) {
    console.log("rate conflicts (latest update used):", conflicts);
  }
  if (skipped.length) {
    console.log("invalid, skipped:", skipped);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to insert.");
    return;
  }
  if (toInsert.length > 0) {
    await db.insert(shippingPincodeRates).values(toInsert);
  }
  console.log(`Inserted ${toInsert.length} shipping rates.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "import failed");
    process.exitCode = 1;
  })
  .finally(() => process.exit());
