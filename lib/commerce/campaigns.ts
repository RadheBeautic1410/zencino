import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  analyticsEvents,
  type Campaign,
  campaigns,
} from "@/db/schema/campaigns";
import { inventoryBalances } from "@/db/schema/inventory";
import { orders } from "@/db/schema/orders";
import { supportRequests } from "@/db/schema/support";
import { audit } from "@/lib/audit";
import { buildCampaignUtmUrl } from "@/lib/commerce/rules";
import { db } from "@/lib/db";

export { buildCampaignUtmUrl };

// Campaign Administration
export async function createOrUpdateCampaign(input: {
  code: string;
  name: string;
  source?: string;
  medium?: string;
  campaign: string;
  content?: string;
  reelUrl?: string;
  landingPath: string;
  active?: boolean;
  actorId?: string;
  actorEmail?: string;
}): Promise<Campaign> {
  const code = input.code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  const name = input.name.trim();

  if (!code || !name) {
    throw new Error("Campaign code and name are required");
  }

  const [existing] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.code, code))
    .limit(1);

  const values = {
    code,
    name,
    source: input.source || "instagram",
    medium: input.medium || "reel",
    campaign: input.campaign || code,
    content: input.content || null,
    reelUrl: input.reelUrl ? input.reelUrl.trim() : null,
    landingPath: input.landingPath ? input.landingPath.trim() : "/products",
    active: input.active ?? true,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(campaigns)
      .set(values)
      .where(eq(campaigns.id, existing.id))
      .returning();

    await audit({
      action: "campaign.updated",
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      entityType: "campaign",
      entityId: updated.id,
      description: `Updated campaign ${updated.code} (${updated.name})`,
      metadata: { code: updated.code },
    });

    return updated;
  }

  const [created] = await db.insert(campaigns).values(values).returning();

  await audit({
    action: "campaign.created",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    entityType: "campaign",
    entityId: created.id,
    description: `Created campaign ${created.code} (${created.name})`,
    metadata: { code: created.code },
  });

  return created;
}

export async function getCampaignsList(): Promise<Campaign[]> {
  return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

// Analytics Event Logging with Deduplication
export async function recordAnalyticsEvent(input: {
  eventName:
    | "page_view"
    | "product_view"
    | "variant_selected"
    | "add_to_cart"
    | "checkout_started"
    | "purchase_confirmed"
    | "amazon_outbound";
  anonymousSessionId?: string | null;
  campaignCode?: string | null;
  productId?: string | null;
  variantId?: string | null;
  orderId?: string | null;
  dedupeKey: string;
  properties?: Record<string, unknown>;
}): Promise<{ recorded: boolean }> {
  try {
    let campaignId: string | null = null;

    if (input.campaignCode) {
      const [camp] = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.code, input.campaignCode.toLowerCase()))
        .limit(1);
      if (camp) {
        campaignId = camp.id;
      }
    }

    await db
      .insert(analyticsEvents)
      .values({
        eventName: input.eventName,
        anonymousSessionId: input.anonymousSessionId ?? null,
        campaignId,
        campaignCode: input.campaignCode ?? null,
        productId: input.productId ?? null,
        variantId: input.variantId ?? null,
        orderId: input.orderId ?? null,
        dedupeKey: input.dedupeKey,
        properties: input.properties ?? {},
      })
      .onConflictDoNothing({ target: analyticsEvents.dedupeKey });

    return { recorded: true };
  } catch (error) {
    // Analytics logging should never fail user requests
    console.error("[analytics] failed to record event:", error);
    return { recorded: false };
  }
}

// Performance Funnel Report per Campaign
export interface CampaignPerformanceSummary {
  addToCarts: number;
  amazonOutboundClicks: number; // Strictly clicks, zero fabricated sales
  campaign: Campaign;
  checkoutStarts: number;
  directOrdersCount: number;
  directRevenueMinor: number;
  pageViews: number;
  productViews: number;
}

export async function getCampaignPerformanceReport(): Promise<
  CampaignPerformanceSummary[]
> {
  const allCampaigns = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));
  const results: CampaignPerformanceSummary[] = [];

  for (const c of allCampaigns) {
    const events = await db
      .select({
        eventName: analyticsEvents.eventName,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.campaignId, c.id));

    let pageViews = 0;
    let productViews = 0;
    let addToCarts = 0;
    let checkoutStarts = 0;
    let amazonOutboundClicks = 0;

    for (const ev of events) {
      if (ev.eventName === "page_view") {
        pageViews++;
      } else if (ev.eventName === "product_view") {
        productViews++;
      } else if (ev.eventName === "add_to_cart") {
        addToCarts++;
      } else if (ev.eventName === "checkout_started") {
        checkoutStarts++;
      } else if (ev.eventName === "amazon_outbound") {
        amazonOutboundClicks++;
      }
    }

    // Direct Website Orders attributed to this campaign
    const attributedOrders = await db
      .select({
        totalMinor: orders.totalMinor,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.attribution}->>'campaignCode' = ${c.code}`,
          inArray(orders.paymentStatus, ["verified", "refunded"])
        )
      );

    const directOrdersCount = attributedOrders.length;
    const directRevenueMinor = attributedOrders.reduce(
      (sum, ord) => sum + ord.totalMinor,
      0
    );

    results.push({
      campaign: c,
      pageViews,
      productViews,
      addToCarts,
      checkoutStarts,
      directOrdersCount,
      directRevenueMinor,
      amazonOutboundClicks,
    });
  }

  return results;
}

// Executive Dashboard Analytics (Unified Overview)
export interface ExecutiveDashboardMetrics {
  activeCampaignsCount: number;
  amazonOutboundClicks: number;
  lowStockCount: number;
  openSupportTicketsCount: number;
  paidDirectOrdersCount: number;
  paidDirectRevenueMinor: number;
  recentAmazonClicks: Array<{
    id: string;
    occurredAt: Date;
    sku: string;
    campaignCode: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalMinor: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
  }>;
  unfulfilledOrdersCount: number;
}

function readEventSku(properties: Record<string, unknown> | null): string {
  const value = properties?.sku;
  return typeof value === "string" && value ? value : "AMAZON-VARIANT";
}

export async function getExecutiveDashboardMetrics(): Promise<ExecutiveDashboardMetrics> {
  // 1. Paid Direct Revenue & Orders
  const verifiedOrders = await db
    .select({
      totalMinor: orders.totalMinor,
    })
    .from(orders)
    .where(inArray(orders.paymentStatus, ["verified", "refunded"]));

  const paidDirectOrdersCount = verifiedOrders.length;
  const paidDirectRevenueMinor = verifiedOrders.reduce(
    (sum, ord) => sum + ord.totalMinor,
    0
  );

  // 2. Total Amazon Outbound Clicks
  const [amazonClicksRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventName, "amazon_outbound"));
  const amazonOutboundClicks = amazonClicksRow?.count ?? 0;

  // 3. Unfulfilled Orders
  const [unfulfilledRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(inArray(orders.status, ["confirmed", "processing"]));
  const unfulfilledOrdersCount = unfulfilledRow?.count ?? 0;

  // 4. Low Stock Inventory Items
  const lowStockRows = await db
    .select({
      variantId: inventoryBalances.variantId,
    })
    .from(inventoryBalances)
    .where(
      sql`${inventoryBalances.onHand} - ${inventoryBalances.reserved} <= ${inventoryBalances.reorderLevel}`
    );
  const lowStockCount = lowStockRows.length;

  // 5. Open Support Tickets
  const [supportRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportRequests)
    .where(inArray(supportRequests.status, ["open", "in_progress"]));
  const openSupportTicketsCount = supportRow?.count ?? 0;

  // 6. Active Campaigns
  const [campaignsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.active, true));
  const activeCampaignsCount = campaignsRow?.count ?? 0;

  // 7. Recent Orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      totalMinor: orders.totalMinor,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  // 8. Recent Amazon Clicks
  const recentClicks = await db
    .select({
      id: analyticsEvents.id,
      occurredAt: analyticsEvents.occurredAt,
      properties: analyticsEvents.properties,
      campaignCode: analyticsEvents.campaignCode,
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventName, "amazon_outbound"))
    .orderBy(desc(analyticsEvents.occurredAt))
    .limit(5);

  const recentAmazonClicks = recentClicks.map((c) => ({
    id: c.id,
    occurredAt: c.occurredAt,
    sku: readEventSku(c.properties),
    campaignCode: c.campaignCode,
  }));

  return {
    paidDirectRevenueMinor,
    paidDirectOrdersCount,
    amazonOutboundClicks,
    unfulfilledOrdersCount,
    lowStockCount,
    openSupportTicketsCount,
    activeCampaignsCount,
    recentOrders,
    recentAmazonClicks,
  };
}
