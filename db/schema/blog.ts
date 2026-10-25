import { createId } from "@paralleldrive/cuid2";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    /** Plain text with light markup: `## Heading`, `- list item`, blank-line paragraphs. */
    body: text("body").notNull().default(""),
    coverImageUrl: text("cover_image_url").notNull().default(""),
    coverImageAlt: text("cover_image_alt").notNull().default(""),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_posts_status_published_idx").on(
      table.status,
      table.publishedAt
    ),
  ]
);

export type BlogPost = typeof blogPosts.$inferSelect;
