"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/authz";
import { getCartDetails } from "@/lib/commerce/cart";
import { type CartPricing, getCartPricing } from "@/lib/commerce/coupons";
import {
  deleteShippingRate,
  quoteShipping,
  saveShippingRate,
} from "@/lib/commerce/shipping";

export interface ShippingActionResult {
  error?: string;
  success?: boolean;
}

export interface ShippingTestResult {
  chargeMinor?: number;
  error?: string;
  isDefaultRate?: boolean;
  matchedPincode?: string | null;
  ratePerKgMinor?: number;
}

export async function saveShippingRateAction(
  formData: FormData
): Promise<ShippingActionResult> {
  const session = await requireAdmin();

  // Admin enters rupees per kg (decimals allowed).
  const rupees = Number(String(formData.get("rate") ?? "").trim());
  if (!Number.isFinite(rupees) || rupees < 0) {
    return { error: "Rate must be 0 or greater." };
  }

  try {
    await saveShippingRate({
      id: String(formData.get("id") || "") || undefined,
      pincode: String(formData.get("pincode") || ""),
      rateMinor: Math.round(rupees * 100),
      description: String(formData.get("description") || ""),
      active: formData.get("active") !== "false",
      actorId: session.user.id,
    });
    revalidatePath("/admin/shipping");
    return { success: true };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save shipping rate",
    };
  }
}

export async function deleteShippingRateAction(
  id: string
): Promise<ShippingActionResult> {
  const session = await requireAdmin();
  await deleteShippingRate({ id, actorId: session.user.id });
  revalidatePath("/admin/shipping");
  return { success: true };
}

/** Admin "test a PIN code" helper. */
export async function testShippingRateAction(
  pincode: string,
  weightG: number
): Promise<ShippingTestResult> {
  await requireAdmin();
  if (!/^\d{6}$/.test(pincode.trim())) {
    return { error: "Enter a 6-digit PIN code." };
  }
  if (!Number.isFinite(weightG) || weightG < 0) {
    return { error: "Weight must be 0 or greater." };
  }
  return await quoteShipping(pincode.trim(), weightG);
}

/** Storefront: totals for the current cart once a delivery PIN code is known. */
export async function getCheckoutPricingAction(
  postcode: string
): Promise<{ pricing?: CartPricing; error?: string }> {
  const [cart, session] = await Promise.all([
    getCartDetails(),
    getCurrentSession(),
  ]);
  if (!cart.cartId || cart.items.length === 0) {
    return { error: "Your bag is empty." };
  }
  const pricing = await getCartPricing(
    cart,
    { userId: session?.user?.id, email: session?.user?.email },
    postcode
  );
  return { pricing };
}
