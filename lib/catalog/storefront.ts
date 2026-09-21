import { getMediaAssetUrl } from "@/lib/media/url";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  categories,
  collectionProducts,
  collections,
  mediaAssets,
  productCategories,
  productMedia,
  products,
  productVariants,
  slugRedirects,
  variantChannels,
} from "@/db/schema/catalog";
import { db } from "@/lib/db";

export async function getStorefrontCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(eq(categories.status, "published"))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getStorefrontFeaturedCollections() {
  const publishedCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
    })
    .from(collections)
    .where(eq(collections.status, "published"))
    .orderBy(desc(collections.updatedAt));

  if (publishedCollections.length === 0) return [];

  const counts = await db
    .select({
      collectionId: collectionProducts.collectionId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(collectionProducts)
    .innerJoin(products, eq(collectionProducts.productId, products.id))
    .where(eq(products.status, "published"))
    .groupBy(collectionProducts.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

  return publishedCollections.map((col) => ({
    ...col,
    productCount: countMap.get(col.id) ?? 0,
  }));
}

export interface StorefrontProductFilters {
  categorySlug?: string;
  collectionSlug?: string;
  query?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
}

export async function getStorefrontProducts(filters: StorefrontProductFilters = {}) {
  const {
    categorySlug,
    collectionSlug,
    query,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = filters;

  const offset = (page - 1) * pageSize;

  let productIdsToInclude: string[] | null = null;

  // Filter by category slug if provided
  if (categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.slug, categorySlug), eq(categories.status, "published")))
      .limit(1);

    if (!cat) return { products: [], totalCount: 0, page, pageSize };

    // Find all subcategories as well
    const subcats = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, cat.id));

    const allCatIds = [cat.id, ...subcats.map((s) => s.id)];

    const matchedProds = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, allCatIds));

    productIdsToInclude = matchedProds.map((p) => p.productId);
    if (productIdsToInclude.length === 0) {
      return { products: [], totalCount: 0, page, pageSize };
    }
  }

  // Filter by collection slug if provided
  if (collectionSlug) {
    const [col] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.slug, collectionSlug), eq(collections.status, "published")))
      .limit(1);

    if (!col) return { products: [], totalCount: 0, page, pageSize };

    const colProds = await db
      .select({ productId: collectionProducts.productId })
      .from(collectionProducts)
      .where(eq(collectionProducts.collectionId, col.id))
      .orderBy(asc(collectionProducts.sortOrder));

    const colIds = colProds.map((cp) => cp.productId);
    if (productIdsToInclude !== null) {
      const set = new Set(colIds);
      productIdsToInclude = productIdsToInclude.filter((id) => set.has(id));
    } else {
      productIdsToInclude = colIds;
    }

    if (productIdsToInclude.length === 0) {
      return { products: [], totalCount: 0, page, pageSize };
    }
  }

  let queryBuilder = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      primaryCategoryId: products.primaryCategoryId,
      primaryCategoryName: categories.name,
      primaryCategorySlug: categories.slug,
      publishedAt: products.publishedAt,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.primaryCategoryId, categories.id))
    .where(
      and(
        eq(products.status, "published"),
        productIdsToInclude ? inArray(products.id, productIdsToInclude) : undefined,
        query
          ? or(
              ilike(products.name, `%${query}%`),
              ilike(products.description, `%${query}%`)
            )
          : undefined
      )
    )
    .$dynamic();

  // Order
  if (sort === "newest") {
    queryBuilder = queryBuilder.orderBy(desc(products.publishedAt), desc(products.createdAt));
  } else {
    queryBuilder = queryBuilder.orderBy(desc(products.createdAt));
  }

  const productRows = await queryBuilder.limit(pageSize).offset(offset);

  if (productRows.length === 0) {
    return { products: [], totalCount: 0, page, pageSize };
  }

  const pIds = productRows.map((p) => p.id);

  // Fetch variants & channels
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
    .where(and(inArray(productVariants.productId, pIds), eq(productVariants.active, true)));

  const vIds = variants.map((v) => v.id);

  const channels = vIds.length > 0
    ? await db
        .select({
          variantId: variantChannels.variantId,
          channel: variantChannels.channel,
          enabled: variantChannels.enabled,
        })
        .from(variantChannels)
        .where(inArray(variantChannels.variantId, vIds))
    : [];

  // Fetch primary media
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      assetId: productMedia.assetId,
      storageKey: mediaAssets.storageKey,
      altText: mediaAssets.altText,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
    .where(inArray(productMedia.productId, pIds))
    .orderBy(asc(productMedia.sortOrder));

  const enrichedProducts = productRows.map((prod) => {
    const prodVariants = variants.filter((v) => v.productId === prod.id);
    const prodVarIds = new Set(prodVariants.map((v) => v.id));
    const prodChannels = channels.filter((c) => prodVarIds.has(c.variantId));
    const prodMedia = mediaRows.filter((m) => m.productId === prod.id);

    const hasWebsite = prodChannels.some((c) => c.channel === "website" && c.enabled);
    const hasAmazon = prodChannels.some((c) => c.channel === "amazon" && c.enabled);

    const validPrices = prodVariants
      .map((v) => v.priceMinor)
      .filter((p): p is number => p !== null && p > 0);

    const minPriceMinor = validPrices.length > 0 ? Math.min(...validPrices) : null;
    const maxMrpMinor = prodVariants
      .map((v) => v.mrpMinor)
      .filter((m): m is number => m !== null && m > 0)
      .reduce((max, m) => (m > max ? m : max), 0);

    return {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      primaryCategoryName: prod.primaryCategoryName,
      primaryCategorySlug: prod.primaryCategorySlug,
      hasWebsiteChannel: hasWebsite,
      hasAmazonChannel: hasAmazon,
      minPriceMinor,
      maxMrpMinor: maxMrpMinor > 0 ? maxMrpMinor : null,
      variantCount: prodVariants.length,
      primaryImage: prodMedia[0] ? getMediaAssetUrl(prodMedia[0].storageKey) : null,
      primaryImageAlt: prodMedia[0]?.altText || prod.name,
    };
  });

  // If sorting by price
  if (sort === "price-asc") {
    enrichedProducts.sort((a, b) => (a.minPriceMinor ?? Infinity) - (b.minPriceMinor ?? Infinity));
  } else if (sort === "price-desc") {
    enrichedProducts.sort((a, b) => (b.minPriceMinor ?? 0) - (a.minPriceMinor ?? 0));
  }

  return {
    products: enrichedProducts,
    totalCount: enrichedProducts.length,
    page,
    pageSize,
  };
}

export async function getStorefrontProductBySlug(slug: string) {
  // Check direct slug match
  let [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .limit(1);

  // If not found, check slug_redirects
  let redirectUrl: string | null = null;
  if (!product) {
    const [redirect] = await db
      .select()
      .from(slugRedirects)
      .where(eq(slugRedirects.oldPath, `/products/${slug}`))
      .limit(1);

    if (redirect) {
      redirectUrl = redirect.newPath;
      return { product: null, redirectUrl };
    }
    return { product: null, redirectUrl: null };
  }

  // Fetch category
  const [category] = product.primaryCategoryId
    ? await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.id, product.primaryCategoryId))
        .limit(1)
    : [null];

  // Fetch active variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, product.id), eq(productVariants.active, true)))
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
      variantId: productMedia.variantId,
      assetId: productMedia.assetId,
      sortOrder: productMedia.sortOrder,
      storageKey: mediaAssets.storageKey,
      altText: mediaAssets.altText,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
    .where(eq(productMedia.productId, product.id))
    .orderBy(asc(productMedia.sortOrder));

  const variantsWithChannels = variants.map((v) => {
    const vChannels = channels.filter((c) => c.variantId === v.id);
    const web = vChannels.find((c) => c.channel === "website");
    const amz = vChannels.find((c) => c.channel === "amazon");

    return {
      ...v,
      websiteEnabled: web?.enabled ?? false,
      amazonEnabled: amz?.enabled ?? false,
      amazonUrl: amz?.externalUrl ?? "",
      asin: amz?.asin ?? "",
    };
  });

  return {
    product: {
      ...product,
      category,
      variants: variantsWithChannels,
      media: media.map((m) => ({
        ...m,
        url: getMediaAssetUrl(m.storageKey),
      })),
    },
    redirectUrl: null,
  };
}
