import { createId } from "@paralleldrive/cuid2";
import {
  index,
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

// 1. Support Requests (customer inquiries & contact tickets)
export const supportRequests = pgTable(
  "support_requests",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    ticketNumber: text("ticket_number").notNull().unique(), // SUP-YYYYMMDD-XXXX
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    orderNumber: text("order_number"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status", {
      enum: ["open", "in_progress", "resolved", "closed"],
    })
      .notNull()
      .default("open"),
    priority: text("priority", {
      enum: ["normal", "high", "urgent"],
    })
      .notNull()
      .default("normal"),
    assignedUserId: text("assigned_user_id").references(() => user.id, { onDelete: "set null" }),
    ...dates(),
  },
  (table) => [
    uniqueIndex("support_requests_ticket_number_idx").on(table.ticketNumber),
    index("support_requests_status_idx").on(table.status),
    index("support_requests_email_idx").on(table.email),
    index("support_requests_user_id_idx").on(table.userId),
    index("support_requests_created_at_idx").on(table.createdAt),
  ]
);

// 2. Support Messages (chronological conversation thread: customer replies & staff internal notes)
export const supportMessages = pgTable(
  "support_messages",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    requestId: text("request_id")
      .notNull()
      .references(() => supportRequests.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    visibility: text("visibility", {
      enum: ["internal", "customer"],
    })
      .notNull()
      .default("customer"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("support_messages_request_id_idx").on(table.requestId),
    index("support_messages_created_at_idx").on(table.createdAt),
  ]
);

export type SupportRequest = typeof supportRequests.$inferSelect;
export type NewSupportRequest = typeof supportRequests.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;
