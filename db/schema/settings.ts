import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

// 1. Store Settings (Key-value store for store configuration, dispatch promises, contacts)
export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(), // 'general', 'dispatch_promises', 'policies', 'checkout'
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StoreSetting = typeof storeSettings.$inferSelect;
export type NewStoreSetting = typeof storeSettings.$inferInsert;
