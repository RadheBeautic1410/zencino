import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { productVariants } from "@/db/schema/catalog";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 1. Inventory Locations (e.g. main website fulfilment warehouse)
export const inventoryLocations = pgTable("inventory_locations", {
  id: text("id").primaryKey().$defaultFn(createId),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  ...dates(),
});

// 2. Inventory Balances (composite PK: variantId + locationId)
export const inventoryBalances = pgTable(
  "inventory_balances",
  {
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    locationId: text("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "restrict" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    reorderLevel: integer("reorder_level").notNull().default(5),
    ...dates(),
  },
  (t) => [
    primaryKey({ columns: [t.variantId, t.locationId] }),
    check("balance_positive_or_zero", sql`${t.onHand} >= ${t.reserved} AND ${t.reserved} >= 0`),
  ]
);

// 3. Inventory Movements (immutable, append-only log)
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    locationId: text("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "restrict" }),
    onHandDelta: integer("on_hand_delta").notNull().default(0),
    reservedDelta: integer("reserved_delta").notNull().default(0),
    reason: text("reason").notNull(), // e.g. "initial_stock", "manual_adjustment", "reservation", "restock"
    referenceType: text("reference_type"), // e.g. "order", "admin_adjustment", "return"
    referenceId: text("reference_id"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key").unique(),
    ...dates(),
  },
  (t) => [
    index("inventory_movements_variant_idx").on(t.variantId, t.createdAt),
  ]
);

// 4. Shopping Carts (supports guest tokens and registered accounts)
export const carts = pgTable(
  "carts",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    guestTokenHash: text("guest_token_hash").unique(),
    currency: text("currency").notNull().default("INR"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...dates(),
  },
  (t) => [
    index("carts_user_idx").on(t.userId),
    index("carts_guest_idx").on(t.guestTokenHash),
  ]
);

// 5. Cart Items
export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    ...dates(),
  },
  (t) => [
    uniqueIndex("cart_variant_unq").on(t.cartId, t.variantId),
    check("cart_item_positive_qty", sql`${t.quantity} > 0`),
  ]
);

// 6. Checkout Attempts & Quotes
export const checkoutStatus = pgEnum("checkout_status", ["pending", "quoted", "converted", "expired"]);
export const checkoutAttempts = pgTable("checkout_attempts", {
  id: text("id").primaryKey().$defaultFn(createId),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  orderId: text("order_id"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  requestHash: text("request_hash").notNull(),
  status: checkoutStatus("status").notNull().default("pending"),
  quoteSnapshot: jsonb("quote_snapshot").$type<{
    subtotalMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
    currency: string;
    items: Array<{
      variantId: string;
      sku: string;
      title: string;
      unitPriceMinor: number;
      quantity: number;
      lineTotalMinor: number;
    }>;
    shippingAddress: {
      recipient: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postcode: string;
      countryCode: string;
    };
  }>().notNull(),
  quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true }).notNull(),
  ...dates(),
});

// 7. Inventory Reservations
export const reservationStatus = pgEnum("reservation_status", ["active", "consumed", "released"]);
export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    attemptId: text("attempt_id").notNull(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    locationId: text("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: reservationStatus("status").notNull().default("active"),
    ...dates(),
  },
  (t) => [
    index("reservations_status_expiry_idx").on(t.status, t.expiresAt),
    check("reservation_positive_qty", sql`${t.quantity} > 0`),
  ]
);

// 8. Shipping Zones & Rates
export const shippingZones = pgTable("shipping_zones", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull().default("IN"),
  active: boolean("active").notNull().default(true),
  ...dates(),
});

export const shippingZonePostcodes = pgTable(
  "shipping_zone_postcodes",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    zoneId: text("zone_id")
      .notNull()
      .references(() => shippingZones.id, { onDelete: "cascade" }),
    postcode: text("postcode").notNull(),
  },
  (t) => [
    uniqueIndex("zone_postcode_unq").on(t.zoneId, t.postcode),
    index("postcode_lookup_idx").on(t.postcode),
  ]
);

export const shippingRates = pgTable("shipping_rates", {
  id: text("id").primaryKey().$defaultFn(createId),
  zoneId: text("zone_id")
    .notNull()
    .references(() => shippingZones.id, { onDelete: "cascade" }),
  minWeightG: integer("min_weight_g").notNull().default(0),
  maxWeightG: integer("max_weight_g"),
  amountMinor: integer("amount_minor").notNull().default(7900), // ₹79 standard
  freeAboveMinor: integer("free_above_minor").default(99900), // Free shipping above ₹999
  active: boolean("active").notNull().default(true),
  ...dates(),
});
