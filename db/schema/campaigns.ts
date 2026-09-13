import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 1. Marketing Campaigns (Instagram and organic social attribution definitions)
export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    code: text("code").notNull().unique(), // e.g. 'acrylic_launch', 'reel_01', 'desk_setup'
    name: text("name").notNull(),
    source: text("source").notNull().default("instagram"),
    medium: text("medium").notNull().default("reel"), // reel, story, bio, post, influencer
    campaign: text("campaign").notNull(), // utm_campaign
    content: text("content"), // utm_content (e.g. 'reel_01')
    reelUrl: text("reel_url"), // direct link to Instagram reel/post
    landingPath: text("landing_path").notNull().default("/products"),
    active: boolean("active").notNull().default(true),
    ...dates(),
  },
  (table) => [
    uniqueIndex("campaigns_code_idx").on(table.code),
    index("campaigns_active_idx").on(table.active),
  ]
);

// 2. Analytics Events (first-party deduplicated event stream)
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    eventName: text("event_name", {
      enum: [
        "page_view",
        "product_view",
        "variant_selected",
        "add_to_cart",
        "checkout_started",
        "purchase_confirmed",
        "amazon_outbound",
      ],
    }).notNull(),
    anonymousSessionId: text("anonymous_session_id"),
    campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    campaignCode: text("campaign_code"),
    productId: text("product_id"),
    variantId: text("variant_id"),
    orderId: text("order_id"),
    dedupeKey: text("dedupe_key").notNull().unique(), // event uniqueness guard
    properties: jsonb("properties").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("analytics_events_dedupe_key_idx").on(table.dedupeKey),
    index("analytics_events_event_name_idx").on(table.eventName),
    index("analytics_events_campaign_id_idx").on(table.campaignId),
    index("analytics_events_campaign_code_idx").on(table.campaignCode),
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
  ]
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
