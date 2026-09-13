"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import {
  createOrUpdateCampaign,
  recordAnalyticsEvent,
} from "@/lib/commerce/campaigns";

export async function saveCampaignAction(formData: FormData) {
  const session = await requireAdmin();

  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const source = String(formData.get("source") || "instagram").trim();
  const medium = String(formData.get("medium") || "reel").trim();
  const campaign = String(formData.get("campaign") || code).trim();
  const content = String(formData.get("content") || "").trim() || undefined;
  const reelUrl = String(formData.get("reelUrl") || "").trim() || undefined;
  const landingPath = String(formData.get("landingPath") || "/products").trim();
  const active = formData.get("active") === "true";

  if (!code || !name) {
    return { success: false, error: "Campaign code and name are required" };
  }

  try {
    const saved = await createOrUpdateCampaign({
      code,
      name,
      source,
      medium,
      campaign,
      content,
      reelUrl,
      landingPath,
      active,
      actorId: session.user.id,
      actorEmail: session.user.email,
    });

    revalidatePath("/admin/campaigns");
    return { success: true, code: saved.code };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save campaign" };
  }
}

export async function recordClientAnalyticsAction(input: {
  eventName: "page_view" | "product_view" | "add_to_cart" | "checkout_started";
  campaignCode?: string | null;
  productId?: string | null;
  variantId?: string | null;
  path: string;
  anonymousSessionId?: string;
}) {
  // Dedupe key: event:sessionId:path:minute
  const minuteStamp = Math.floor(Date.now() / 60000);
  const dedupeKey = `${input.eventName}:${input.anonymousSessionId || "anon"}:${input.path}:${minuteStamp}`;

  await recordAnalyticsEvent({
    eventName: input.eventName,
    campaignCode: input.campaignCode,
    productId: input.productId,
    variantId: input.variantId,
    anonymousSessionId: input.anonymousSessionId,
    dedupeKey,
    properties: {
      path: input.path,
    },
  });

  return { success: true };
}
