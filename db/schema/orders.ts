import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
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
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    attribution: jsonb("attribution").$type<Record<string, unknown>>(),
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

// 5. Customer Saved Addresses (Address book for repeat checkouts)
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").notNull().default(false),
    recipient: text("recipient").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postcode: text("postcode").notNull(),
    countryCode: text("country_code").notNull().default("IN"),
    ...dates(),
  },
  (table) => [
    index("customer_addresses_user_id_idx").on(table.userId),
    index("customer_addresses_user_default_idx").on(table.userId, table.isDefault),
  ]
);

// 6. Order Cancellations
export const orderCancellations = pgTable(
  "order_cancellations",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    requestedBy: text("requested_by", { enum: ["customer", "admin"] })
      .notNull()
      .default("customer"),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["requested", "approved", "rejected"] })
      .notNull()
      .default("requested"),
    adminNote: text("admin_note"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...dates(),
  },
  (table) => [
    index("order_cancellations_order_id_idx").on(table.orderId),
    index("order_cancellations_status_idx").on(table.status),
  ]
);

// 7. Order Returns
export const orderReturns = pgTable(
  "order_returns",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    returnNumber: text("return_number").notNull().unique(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItems.id),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull().default(1),
    reason: text("reason", {
      enum: [
        "damaged_in_transit",
        "wrong_item",
        "defective_quality",
        "not_as_described",
        "other",
      ],
    }).notNull(),
    customerNote: text("customer_note"),
    photos: jsonb("photos").$type<string[]>().default([]),
    status: text("status", {
      enum: [
        "requested",
        "approved",
        "rejected",
        "received",
        "completed",
        "cancelled",
      ],
    })
      .notNull()
      .default("requested"),
    restockAction: text("restock_action", {
      enum: ["none", "restocked", "scrapped"],
    })
      .notNull()
      .default("none"),
    refundAmountMinor: integer("refund_amount_minor").notNull().default(0),
    adminNote: text("admin_note"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...dates(),
  },
  (table) => [
    uniqueIndex("order_returns_return_number_idx").on(table.returnNumber),
    index("order_returns_order_id_idx").on(table.orderId),
    index("order_returns_item_id_idx").on(table.orderItemId),
    index("order_returns_status_idx").on(table.status),
  ]
);

// 8. Order Refunds & GST Credit Notes
export const orderRefunds = pgTable(
  "order_refunds",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    refundNumber: text("refund_number").notNull().unique(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    returnId: text("return_id").references(() => orderReturns.id, { onDelete: "set null" }),
    cancellationId: text("cancellation_id").references(() => orderCancellations.id, { onDelete: "set null" }),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("INR"),
    reason: text("reason").notNull(),
    method: text("method").notNull().default("upi_reversal"),
    transactionReference: text("transaction_reference"), // bank UTR / refund reference
    creditNoteNumber: text("credit_note_number").notNull().unique(),
    status: text("status", { enum: ["pending", "completed", "failed"] })
      .notNull()
      .default("completed"),
    processedBy: text("processed_by").references(() => user.id, { onDelete: "set null" }),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
    ...dates(),
  },
  (table) => [
    uniqueIndex("order_refunds_refund_number_idx").on(table.refundNumber),
    uniqueIndex("order_refunds_credit_note_number_idx").on(table.creditNoteNumber),
    index("order_refunds_order_id_idx").on(table.orderId),
    index("order_refunds_return_id_idx").on(table.returnId),
  ]
);
