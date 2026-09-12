import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const catalogStatus = pgEnum("catalog_status", ["draft", "published", "archived"]);
export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(createId),
  parentId: text("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  status: catalogStatus("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0), ...dates(),
}, (t) => [index("categories_parent_idx").on(t.parentId), check("category_not_own_parent", sql`${t.id} <> ${t.parentId}`)]);

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  primaryCategoryId: text("primary_category_id").references(() => categories.id, { onDelete: "restrict" }),
  status: catalogStatus("status").notNull().default("draft"),
  specifications: jsonb("specifications").$type<Record<string, string>>().notNull().default({}),
  care: text("care").notNull().default(""), packageContents: text("package_contents").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""), seoDescription: text("seo_description").notNull().default(""),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...dates(),
}, (t) => [index("products_status_date_idx").on(t.status, t.createdAt), index("products_category_idx").on(t.primaryCategoryId)]);

export const productCategories = pgTable("product_categories", {
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
}, (t) => [primaryKey({ columns: [t.productId, t.categoryId] })]);

export const productVariants = pgTable("product_variants", {
  id: text("id").primaryKey().$defaultFn(createId),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  sku: text("sku").notNull().unique(), title: text("title").notNull(),
  options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
  optionSignature: text("option_signature").notNull().default("[]"),
  priceMinor: integer("price_minor"), mrpMinor: integer("mrp_minor"),
  currency: text("currency").notNull().default("INR"),
  weightG: integer("weight_g"), lengthMm: integer("length_mm"), widthMm: integer("width_mm"), heightMm: integer("height_mm"),
  active: boolean("active").notNull().default(true), ...dates(),
}, (t) => [uniqueIndex("variant_product_options_unq").on(t.productId, t.optionSignature),
  check("variant_nonnegative_price", sql`${t.priceMinor} >= 0`),
  check("variant_valid_mrp", sql`${t.mrpMinor} >= 0 AND (${t.priceMinor} IS NULL OR ${t.mrpMinor} >= ${t.priceMinor})`),
  check("variant_positive_dimensions", sql`(${t.weightG} IS NULL OR ${t.weightG} > 0) AND (${t.lengthMm} IS NULL OR ${t.lengthMm} > 0) AND (${t.widthMm} IS NULL OR ${t.widthMm} > 0) AND (${t.heightMm} IS NULL OR ${t.heightMm} > 0)`),
]);

export const salesChannel = pgEnum("sales_channel", ["website", "amazon"]);
export const variantChannels = pgTable("variant_channels", {
  id: text("id").primaryKey().$defaultFn(createId),
  variantId: text("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  channel: salesChannel("channel").notNull(), enabled: boolean("enabled").notNull().default(false),
  externalUrl: text("external_url"), asin: text("asin"), verifiedAt: timestamp("verified_at", { withTimezone: true }), ...dates(),
}, (t) => [uniqueIndex("variant_channel_unq").on(t.variantId, t.channel)]);

export const mediaAssets = pgTable("media_assets", {
  id: text("id").primaryKey().$defaultFn(createId),
  storageKey: text("storage_key").notNull().unique(), originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(), bytes: integer("bytes").notNull(),
  width: integer("width").notNull(), height: integer("height").notNull(),
  checksum: text("checksum").notNull(), altText: text("alt_text").notNull(),
  source: text("source").notNull().default("owner"), rightsNote: text("rights_note").notNull().default(""),
  ...dates(),
}, (t) => [check("media_positive_size", sql`${t.bytes} > 0 AND ${t.width} > 0 AND ${t.height} > 0`)]);
export const productMedia = pgTable("product_media", {
  id: text("id").primaryKey().$defaultFn(createId),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id, { onDelete: "restrict" }),
  assetId: text("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("product_media_product_idx").on(t.productId)]);

export const collections = pgTable("collections", {
  id: text("id").primaryKey().$defaultFn(createId), name: text("name").notNull(), slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""), status: catalogStatus("status").notNull().default("draft"), ...dates(),
});
export const collectionProducts = pgTable("collection_products", {
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.collectionId, t.productId] })]);

export const slugRedirects = pgTable("slug_redirects", {
  id: text("id").primaryKey().$defaultFn(createId), oldPath: text("old_path").notNull().unique(), newPath: text("new_path").notNull(), ...dates(),
});
