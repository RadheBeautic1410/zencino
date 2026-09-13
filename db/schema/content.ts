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

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 1. Content Pages (slug-indexed registry of CMS manageable pages/sections)
export const contentPages = pgTable(
  "content_pages",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    slug: text("slug").notNull().unique(), // e.g. 'home', 'faq', 'about', 'policies-shipping', 'policies-returns', etc.
    title: text("title").notNull(),
    type: text("type", {
      enum: ["homepage", "faq", "about", "policy"],
    }).notNull(),
    currentVersionId: text("current_version_id"),
    ...dates(),
  },
  (table) => [
    uniqueIndex("content_pages_slug_idx").on(table.slug),
    index("content_pages_type_idx").on(table.type),
  ]
);

// 2. Content Versions (immutable publication history and drafts)
export const contentVersions = pgTable(
  "content_versions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    pageId: text("page_id")
      .notNull()
      .references(() => contentPages.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    })
      .notNull()
      .default("draft"),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...dates(),
  },
  (table) => [
    uniqueIndex("content_versions_page_version_idx").on(table.pageId, table.version),
    index("content_versions_page_id_idx").on(table.pageId),
    index("content_versions_status_idx").on(table.status),
  ]
);

export type ContentPage = typeof contentPages.$inferSelect;
export type NewContentPage = typeof contentPages.$inferInsert;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;
