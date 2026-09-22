import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { productVariants, variantChannels } from "@/db/schema/catalog";
import { audit } from "@/lib/audit";
import { isAmazonProductUrl } from "@/lib/catalog/validation";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get("variantId");
  const sku = searchParams.get("sku");

  if (!variantId && !sku) {
    return NextResponse.json(
      { error: "Missing variantId or sku parameter" },
      { status: 400 }
    );
  }

  const condition = variantId
    ? eq(productVariants.id, variantId)
    : eq(productVariants.sku, (sku || "").toUpperCase());

  const [record] = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      productId: productVariants.productId,
      channelId: variantChannels.id,
      enabled: variantChannels.enabled,
      externalUrl: variantChannels.externalUrl,
      asin: variantChannels.asin,
    })
    .from(productVariants)
    .innerJoin(
      variantChannels,
      and(
        eq(variantChannels.variantId, productVariants.id),
        eq(variantChannels.channel, "amazon")
      )
    )
    .where(condition)
    .limit(1);

  if (!record?.enabled || !record.externalUrl) {
    return NextResponse.json(
      { error: "Amazon purchase link is not available for this variant." },
      { status: 404 }
    );
  }

  if (!isAmazonProductUrl(record.externalUrl)) {
    return NextResponse.json(
      { error: "Destination is not an authorized Amazon India product URL." },
      { status: 400 }
    );
  }

  // Record outbound click for campaign & conversion attribution
  const campaignCookie = request.cookies.get("zen_attribution")?.value;
  const campaignCode =
    searchParams.get("utm_campaign") ||
    searchParams.get("campaign") ||
    campaignCookie ||
    null;
  const sessionId = request.cookies.get("zen_anon_session")?.value || null;

  await audit({
    action: "catalog.amazon_outbound_click",
    entityType: "variant",
    entityId: record.id,
    description: `Customer outbound click to Amazon for SKU ${record.sku}`,
    metadata: {
      sku: record.sku,
      asin: record.asin,
      productId: record.productId,
      destination: record.externalUrl,
      campaignCode,
    },
  });

  const { recordAnalyticsEvent } = await import("@/lib/commerce/campaigns");
  await recordAnalyticsEvent({
    eventName: "amazon_outbound",
    anonymousSessionId: sessionId,
    campaignCode,
    productId: record.productId,
    variantId: record.id,
    dedupeKey: `outbound:amazon:${record.id}:${sessionId || "anon"}:${Date.now()}`,
    properties: {
      sku: record.sku,
      asin: record.asin,
      destination: record.externalUrl,
    },
  });

  return NextResponse.redirect(record.externalUrl, { status: 307 });
}
