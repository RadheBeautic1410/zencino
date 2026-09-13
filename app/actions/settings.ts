"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { updateStoreProfileConfig } from "@/lib/commerce/settings";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireAdmin();

  const storeName = String(formData.get("storeName") || "Zencino").trim();
  const legalEntityName = String(formData.get("legalEntityName") || "").trim();
  const gstin = String(formData.get("gstin") || "").trim();
  const pan = String(formData.get("pan") || "").trim();
  const cin = String(formData.get("cin") || "").trim();
  const registeredAddress = String(formData.get("registeredAddress") || "").trim();
  const supportEmail = String(formData.get("supportEmail") || "").trim();
  const supportPhone = String(formData.get("supportPhone") || "").trim();
  const supportHours = String(formData.get("supportHours") || "").trim();
  const dispatchPromise = String(formData.get("dispatchPromise") || "").trim();
  const checkoutEnabled = formData.get("checkoutEnabled") === "true";

  try {
    await updateStoreProfileConfig({
      config: {
        storeName,
        legalEntityName,
        gstin,
        pan,
        cin,
        registeredAddress,
        supportEmail,
        supportPhone,
        supportHours,
        dispatchPromise,
        checkoutEnabled,
      },
      actorId: session.user.id,
      actorEmail: session.user.email,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update store settings" };
  }
}
