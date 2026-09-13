import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "../lib/db";
import {
  categories,
  collectionProducts,
  collections,
  productCategories,
  productMedia,
  products,
  productVariants,
  variantChannels,
} from "../db/schema/catalog";
import {
  inventoryBalances,
  inventoryLocations,
  inventoryMovements,
} from "../db/schema/inventory";
import {
  orderAddresses,
  orderCancellations,
  orderItems,
  orderRefunds,
  orderReturns,
  orders,
  paymentProofs,
} from "../db/schema/orders";
import { contentPages, contentVersions } from "../db/schema/content";
import { supportMessages, supportRequests } from "../db/schema/support";
import { campaigns } from "../db/schema/campaigns";
import { storeSettings } from "../db/schema/settings";

if (existsSync(".env")) {
  process.loadEnvFile();
}

async function main() {
  console.log("=================================================");
  console.log("  Zencino Database Backup Snapshot Utility       ");
  console.log("=================================================");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `zencino-backup-${timestamp}.json`);

  console.log(`\nExporting tables to: ${backupFile}...`);

  const snapshot = {
    metadata: {
      timestamp: new Date().toISOString(),
      generator: "zencino-db-backup-utility",
      version: "1.0",
    },
    tables: {
      categories: await db.select().from(categories),
      collections: await db.select().from(collections),
      collectionProducts: await db.select().from(collectionProducts),
      products: await db.select().from(products),
      productCategories: await db.select().from(productCategories),
      productMedia: await db.select().from(productMedia),
      productVariants: await db.select().from(productVariants),
      variantChannels: await db.select().from(variantChannels),
      inventoryLocations: await db.select().from(inventoryLocations),
      inventoryBalances: await db.select().from(inventoryBalances),
      inventoryMovements: await db.select().from(inventoryMovements),
      orders: await db.select().from(orders),
      orderItems: await db.select().from(orderItems),
      orderAddresses: await db.select().from(orderAddresses),
      paymentProofs: await db.select().from(paymentProofs),
      orderCancellations: await db.select().from(orderCancellations),
      orderReturns: await db.select().from(orderReturns),
      orderRefunds: await db.select().from(orderRefunds),
      contentPages: await db.select().from(contentPages),
      contentVersions: await db.select().from(contentVersions),
      supportRequests: await db.select().from(supportRequests),
      supportMessages: await db.select().from(supportMessages),
      campaigns: await db.select().from(campaigns),
      storeSettings: await db.select().from(storeSettings),
    },
  };

  const jsonStr = JSON.stringify(snapshot, null, 2);
  writeFileSync(backupFile, jsonStr, "utf-8");

  console.log("\nSnapshot Summary:");
  for (const [table, rows] of Object.entries(snapshot.tables)) {
    console.log(`  - ${table.padEnd(22)}: ${(rows as any[]).length} rows`);
  }

  console.log(`\n[✓] Successfully generated backup snapshot: ${backupFile}`);
  console.log("=================================================\n");
}

main()
  .catch((err) => {
    console.error("\n[!] Database backup failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
