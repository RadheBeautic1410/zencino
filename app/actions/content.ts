"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import {
  publishContentVersion,
  saveContentVersionDraft,
} from "@/lib/commerce/content";

export async function saveContentDraftAction(formData: FormData) {
  const session = await requireAdmin();

  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "") as any;
  const summary = String(formData.get("summary") || "").trim();
  const rawData = String(formData.get("data") || "{}");

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawData);
  } catch {
    return { success: false, error: "Invalid JSON content data" };
  }

  try {
    const version = await saveContentVersionDraft({
      slug,
      title,
      type,
      summary,
      data,
      authorId: session.user.id,
    });

    revalidatePath("/admin/content");
    return { success: true, versionId: version.id, version: version.version };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save draft" };
  }
}

export async function publishContentAction(formData: FormData) {
  const session = await requireAdmin();

  const versionId = String(formData.get("versionId") || "").trim();
  if (!versionId) {
    return { success: false, error: "Version ID is required" };
  }

  try {
    const result = await publishContentVersion({
      versionId,
      actorId: session.user.id,
      actorEmail: session.user.email,
    });

    // Revalidate public storefront pages
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/faq");
    revalidatePath("/policies/shipping");
    revalidatePath("/policies/returns");
    revalidatePath("/policies/privacy");
    revalidatePath("/policies/terms");
    revalidatePath("/admin/content");

    return { success: true, pageSlug: result.page.slug, version: result.version.version };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to publish content" };
  }
}
