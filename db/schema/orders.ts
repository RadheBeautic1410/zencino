import { createId } from "@paralleldrive/cuid2";
import {
  index,
  integer,
  jsonb,
  pgTable,
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

// 1. Orders Table
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    guestTokenHash: text("guest_token_hash"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    currency: text("currency").notNull().default("INR"),
    subtotalMinor: integer("subtotal_minor").notNull(),
    shippingMinor: integer("shipping_minor").notNull(),
    taxMinor: integer("tax_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
    status: text("status", {
      enum: [
        "pending_payment",
        "payment_review",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    })
      .notNull()
      .default("pending_payment"),
    paymentStatus: text("payment_status", {
      enum: ["pending", "under_review", "verified", "rejected", "refunded"],
    })
      .notNull()
      .default("pending"),
    paymentMethod: text("payment_method", {
      enum: ["upi_qr", "razorpay"],
    })
      .notNull()
      .default("upi_qr"),
    cancelReason: text("cancel_reason"),
    trackingCourier: text("tracking_courier"),
    trackingNumber: text("tracking_number"),
    ...dates(),
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

// 2. Order Line Items (immutable snapshot)
export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    variantTitle: text("variant_title").notNull(),
    sku: text("sku").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalMinor: integer("line_total_minor").notNull(),
    weightG: integer("weight_g").notNull().default(300),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_variant_id_idx").on(table.variantId),
  ]
);

// 3. Order Addresses (shipping & billing snapshot)
export const orderAddresses = pgTable(
  "order_addresses",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["shipping", "billing"] })
      .notNull()
      .default("shipping"),
    recipient: text("recipient").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postcode: text("postcode").notNull(),
    countryCode: text("country_code").notNull().default("IN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_addresses_order_id_idx").on(table.orderId)]
);

// 4. Payment Proofs (for UPI QR manual verification)
export const paymentProofs = pgTable(
  "payment_proofs",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: text("method").notNull().default("upi_qr"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("INR"),
    upiReference: text("upi_reference").notNull(), // UTR / transaction ID
    screenshotUrl: text("screenshot_url").notNull(), // uploaded image proof
    status: text("status", { enum: ["under_review", "verified", "rejected"] })
      .notNull()
      .default("under_review"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    ...dates(),
  },
  (table) => [
    index("payment_proofs_order_id_idx").on(table.orderId),
    index("payment_proofs_status_idx").on(table.status),
    index("payment_proofs_upi_ref_idx").on(table.upiReference),
  ]
);
