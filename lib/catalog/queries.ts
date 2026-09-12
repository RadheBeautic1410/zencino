import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  categories,
  collectionProducts,
  collections,
  mediaAssets,
  productCategories,
  productMedia,
  products,
  productVariants,
  variantChannels,
} from "@/db/schema/catalog";
import { db } from "@/lib/db";

export async function getAllCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryById(id: string) {
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return cat || null;
}

export interface ProductListParams {
  status?: "draft" | "published" | "archived";
  categoryId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export async function getAdminProducts(params: ProductListParams = {}) {
  const { status, categoryId, query, limit = 50, offset = 0 } = params;

  let queryBuilder = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      status: products.status,
      primaryCategoryId: products.primaryCategoryId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      primaryCategoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.primaryCategoryId, categories.id))
    .$dynamic();

  if (status) {
    queryBuilder = queryBuilder.where(eq(products.status, status));
  }

  if (categoryId) {
    queryBuilder = queryBuilder.where(eq(products.primaryCategoryId, categoryId));
  }

  const productRows = await queryBuilder
    .orderBy(desc(products.updatedAt))
    .limit(limit)
    .offset(offset);

  if (productRows.length === 0) {
    return [];
  }

  const productIds = productRows.map((p) => p.id);

  // Fetch variants and their channels
  const variants = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      priceMinor: productVariants.priceMinor,
      mrpMinor: productVariants.mrpMinor,
      active: productVariants.active,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  const variantIds = variants.map((v) => v.id);

  const channels = variantIds.length > 0
    ? await db
        .select({
          variantId: variantChannels.variantId,
          channel: variantChannels.channel,
          enabled: variantChannels.enabled,
        })
        .from(variantChannels)
        .where(inArray(variantChannels.variantId, variantIds))
    : [];

  // Fetch primary media for each product
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      assetId: productMedia.assetId,
      storageKey: mediaAssets.storageKey,
      altText: mediaAssets.altText,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sortOrder));

  return productRows.map((prod) => {
    const prodVariants = variants.filter((v) => v.productId === prod.id);
    const prodVariantIds = new Set(prodVariants.map((v) => v.id));
    const prodChannels = channels.filter((c) => prodVariantIds.has(c.variantId));
    const prodMedia = mediaRows.filter((m) => m.productId === prod.id);

    const hasWebsite = prodChannels.some((c) => c.channel === "website" && c.enabled);
    const hasAmazon = prodChannels.some((c) => c.channel === "amazon" && c.enabled);

    return {
      ...prod,
      variantCount: prodVariants.length,
      hasWebsiteChannel: hasWebsite,
      hasAmazonChannel: hasAmazon,
      minPriceMinor: prodVariants.reduce(
        (min, v) => (v.priceMinor !== null && (min === null || v.priceMinor < min) ? v.priceMinor : min),
        null as number | null
      ),
      primaryImage: prodMedia[0] ? `/uploads/${prodMedia[0].storageKey}` : null,
    };
  });
}

export async function getProductWithDetails(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;

  const [category] = product.primaryCategoryId
    ? await db.select().from(categories).where(eq(categories.id, product.primaryCategoryId)).limit(1)
    : [null];

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.createdAt));

  const variantIds = variants.map((v) => v.id);

  const channels = variantIds.length > 0
    ? await db
        .select()
        .from(variantChannels)
        .where(inArray(variantChannels.variantId, variantIds))
    : [];

  const media = await db
    .select({
      id: productMedia.id,
      productId: productMedia.productId,
      variantId: productMedia.variantId,
      assetId: productMedia.assetId,
      sortOrder: productMedia.sortOrder,
      storageKey: mediaAssets.storageKey,
      altText: mediaAssets.altText,
      originalFilename: mediaAssets.originalFilename,
      mimeType: mediaAssets.mimeType,
      bytes: mediaAssets.bytes,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
    .where(eq(productMedia.productId, id))
    .orderBy(asc(productMedia.sortOrder));

  const variantsWithChannels = variants.map((v) => {
    const vChannels = channels.filter((c) => c.variantId === v.id);
    const webChannel = vChannels.find((c) => c.channel === "website");
    const amzChannel = vChannels.find((c) => c.channel === "amazon");

    return {
      ...v,
      websiteEnabled: webChannel?.enabled ?? false,
      amazonEnabled: amzChannel?.enabled ?? false,
      amazonUrl: amzChannel?.externalUrl ?? "",
      asin: amzChannel?.asin ?? "",
    };
  });

  return {
    ...product,
    category,
    variants: variantsWithChannels,
    media,
  };
}

export async function getAllCollections() {
  const allCollections = await db
    .select()
    .from(collections)
    .orderBy(desc(collections.updatedAt));

  const counts = await db
    .select({
      collectionId: collectionProducts.collectionId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(collectionProducts)
    .groupBy(collectionProducts.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

  return allCollections.map((col) => ({
    ...col,
    productCount: countMap.get(col.id) ?? 0,
  }));
}

export async function getCollectionWithProducts(id: string) {
  const [col] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!col) return null;

  const items = await db
    .select({
      collectionId: collectionProducts.collectionId,
      productId: collectionProducts.productId,
      sortOrder: collectionProducts.sortOrder,
      productName: products.name,
      productSlug: products.slug,
      productStatus: products.status,
    })
    .from(collectionProducts)
    .innerJoin(products, eq(collectionProducts.productId, products.id))
    .where(eq(collectionProducts.collectionId, id))
    .orderBy(asc(collectionProducts.sortOrder));

  return {
    ...col,
    items,
  };
}

export async function getAllMediaAssets(limit = 100, offset = 0) {
  return db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(limit)
    .offset(offset);
}
