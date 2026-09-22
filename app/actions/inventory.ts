"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { adjustStock } from "@/lib/commerce/inventory";

export interface InventoryActionResult {
  error?: string;
  success?: boolean;
}

export async function adjustStockAction(
  formData: FormData
): Promise<InventoryActionResult> {
  const admin = await requireAdmin();

  const variantId = String(formData.get("variantId") || "").trim();
  const deltaInput = formData.get("onHandDelta");
  const reason = String(formData.get("reason") || "").trim();

  if (!variantId) {
    return { error: "Variant is required" };
  }

  const onHandDelta = Number(deltaInput);
  if (Number.isNaN(onHandDelta) || onHandDelta === 0) {
    return { error: "Stock adjustment delta must be a non-zero integer" };
  }

  if (!reason || reason.length < 3) {
    return {
      error:
        "A clear reason is required for every stock adjustment (e.g. 'Received shipment', 'Damaged writeoff')",
    };
  }

  try {
    await adjustStock({
      variantId,
      onHandDelta,
      reason,
      actorId: admin.user.id,
      referenceType: "admin_adjustment",
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to adjust stock";
    return { error: msg };
  }
}
