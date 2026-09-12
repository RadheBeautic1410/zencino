"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/authz";
import {
  deleteCustomerAddress,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from "@/lib/commerce/customer-account";

export interface AddressActionResult {
  success?: boolean;
  error?: string;
}

export async function saveAddressAction(formData: FormData): Promise<AddressActionResult> {
  try {
    const session = await requireSession();

    const id = formData.get("id") ? String(formData.get("id")) : undefined;
    const recipient = String(formData.get("recipient") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const line1 = String(formData.get("line1") || "").trim();
    const line2 = String(formData.get("line2") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const postcode = String(formData.get("postcode") || "").trim();
    const isDefault = formData.get("isDefault") === "true";

    await saveCustomerAddress({
      id,
      userId: session.user.id,
      address: {
        recipient,
        phone,
        line1,
        line2: line2 || undefined,
        city,
        state,
        postcode,
        isDefault,
      },
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save delivery address";
    return { error: message };
  }
}

export async function deleteAddressAction(addressId: string): Promise<AddressActionResult> {
  try {
    const session = await requireSession();
    await deleteCustomerAddress(addressId, session.user.id);

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete address";
    return { error: message };
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<AddressActionResult> {
  try {
    const session = await requireSession();
    await setDefaultCustomerAddress(addressId, session.user.id);

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set default address";
    return { error: message };
  }
}
