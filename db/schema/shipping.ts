import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// PIN-code pattern shipping rates (charge per started kg), managed in admin.
// Separate from the zone/weight-band tables in inventory.ts, which are unused.
export const shippingPincodeRates = pgTable(
  "shipping_pincode_rates",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    // exact: 364001, range: 364001-364005, wildcard: 36****
    pincode: text("pincode").notNull(),
    type: text("type", { enum: ["exact", "range", "wildcard"] }).notNull(),
    // paise per kg
    rateMinor: integer("rate_minor").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shipping_pincode_rates_pincode_idx").on(table.pincode),
    index("shipping_pincode_rates_active_idx").on(table.active),
  ]
);

export type ShippingPincodeRate = typeof shippingPincodeRates.$inferSelect;
