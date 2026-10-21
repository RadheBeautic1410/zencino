import { and, asc, eq, inArray, notLike } from "drizzle-orm";
import {
  categories,
  mediaAssets,
  productMedia,
  products,
  productVariants,
  variantChannels,
} from "@/db/schema/catalog";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getMediaAssetUrl } from "@/lib/media/url";

// Google Merchant Center scheduled-fetch feed (RSS 2.0 + g: namespace) of every
// published, website-sellable variant. Register this URL as a product data source.
export const revalidate = 3600;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const tag = (name: string, value: string | null | undefined) =>
  value ? `<${name}>${escapeXml(value)}</${name}>` : "";

const inr = (minor: number) => `${(minor / 100).toFixed(2)} INR`;

export async function GET() {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://zencino.com";
  const absolute = (url: string) =>
    url.startsWith("http") ? url : `${baseUrl}${url}`;

  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      seoDescription: products.seoDescription,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.primaryCategoryId, categories.id))
    .where(eq(products.status, "published"));

  const productIds = productRows.map((p) => p.id);
  const variants =
    productIds.length > 0
      ? await db
          .select({
            id: productVariants.id,
            productId: productVariants.productId,
            sku: productVariants.sku,
            title: productVariants.title,
            priceMinor: productVariants.priceMinor,
            mrpMinor: productVariants.mrpMinor,
            weightG: productVariants.weightG,
          })
          .from(productVariants)
          .innerJoin(
            variantChannels,
            and(
              eq(variantChannels.variantId, productVariants.id),
              eq(variantChannels.channel, "website"),
              eq(variantChannels.enabled, true)
            )
          )
          .where(
            and(
              inArray(productVariants.productId, productIds),
              eq(productVariants.active, true)
            )
          )
      : [];

  const media =
    productIds.length > 0
      ? await db
          .select({
            productId: productMedia.productId,
            storageKey: mediaAssets.storageKey,
          })
          .from(productMedia)
          .innerJoin(mediaAssets, eq(productMedia.assetId, mediaAssets.id))
          .where(
            and(
              inArray(productMedia.productId, productIds),
              notLike(mediaAssets.mimeType, "video/%")
            )
          )
          .orderBy(asc(productMedia.sortOrder))
      : [];

  const items: string[] = [];
  for (const product of productRows) {
    const images = media
      .filter((m) => m.productId === product.id)
      .map((m) => absolute(getMediaAssetUrl(m.storageKey)));
    const productVariantsForFeed = variants.filter(
      (v) => v.productId === product.id && v.priceMinor
    );
    // Merchant Center rejects items without a price or an image.
    if (images.length === 0) {
      continue;
    }

    for (const variant of productVariantsForFeed) {
      const price = variant.priceMinor as number;
      const onSale = variant.mrpMinor !== null && variant.mrpMinor > price;
      const title =
        productVariantsForFeed.length > 1
          ? `${product.name} - ${variant.title}`
          : product.name;
      const description = (product.description || product.seoDescription)
        .replace(/\s+/g, " ")
        .slice(0, 5000);

      items.push(
        [
          "<item>",
          tag("g:id", variant.sku),
          tag("g:title", title.slice(0, 150)),
          tag("g:description", description),
          tag("g:link", `${baseUrl}/products/${product.slug}`),
          tag("g:image_link", images[0]),
          ...images
            .slice(1, 11)
            .map((url) => tag("g:additional_image_link", url)),
          tag("g:availability", "in_stock"),
          tag("g:price", inr(onSale ? (variant.mrpMinor as number) : price)),
          onSale ? tag("g:sale_price", inr(price)) : "",
          tag("g:condition", "new"),
          tag("g:brand", "Zencino"),
          tag("g:identifier_exists", "no"),
          tag("g:product_type", product.categoryName),
          productVariantsForFeed.length > 1
            ? tag("g:item_group_id", product.id)
            : "",
          variant.weightG
            ? tag("g:shipping_weight", `${variant.weightG} g`)
            : "",
          "</item>",
        ].join("")
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Zencino</title>
<link>${escapeXml(baseUrl)}</link>
<description>Zencino product feed</description>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
