import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";
import { orders } from "@/db/schema/orders";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 1. Discount coupons managed by admins and applied on cart/checkout
export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    code: text("code").notNull().unique(), // stored uppercase, e.g. 'WELCOME10'
    description: text("description"),
    discountType: text("discount_type", { enum: ["percent", "fixed"] })
      .notNull()
      .default("percent"),
    // percent: 1-100, fixed: amount in paise
    discountValue: integer("discount_value").notNull(),
    maxDiscountMinor: integer("max_discount_minor"), // cap for percent coupons
    // which cart items the discount is calculated on
    appliesTo: text("applies_to", { enum: ["all", "products", "categories"] })
      .notNull()
      .default("all"),
    minOrderMinor: integer("min_order_minor").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    usageLimit: integer("usage_limit"), // total redemptions, null = unlimited
    perCustomerLimit: integer("per_customer_limit").notNull().default(1),
    active: boolean("active").notNull().default(true),
    ...dates(),
  },
  (table) => [
    uniqueIndex("coupons_code_idx").on(table.code),
    index("coupons_active_idx").on(table.active),
  ]
);

// Products / categories / collections a restricted coupon applies to
export const couponTargets = pgTable(
  "coupon_targets",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    targetType: text("target_type", {
      enum: ["product", "category", "collection"],
    }).notNull(),
    targetId: text("target_id").notNull(),
  },
  (table) => [
    uniqueIndex("coupon_targets_unique_idx").on(
      table.couponId,
      table.targetType,
      table.targetId
    ),
    index("coupon_targets_coupon_idx").on(table.couponId),
  ]
);

// 2. One row per order that used a coupon (discount snapshot)
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    customerEmail: text("customer_email").notNull(),
    discountMinor: integer("discount_minor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("coupon_redemptions_order_idx").on(table.orderId),
    index("coupon_redemptions_coupon_idx").on(table.couponId),
    index("coupon_redemptions_user_idx").on(table.userId),
    index("coupon_redemptions_email_idx").on(table.customerEmail),
  ]
);

export type Coupon = typeof coupons.$inferSelect;
