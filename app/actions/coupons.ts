"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/authz";
import { getCartDetails } from "@/lib/commerce/cart";
import {
  applyCouponToCart,
  removeCouponFromCart,
  type SaveCouponInput,
  saveCoupon,
  setCouponActive,
} from "@/lib/commerce/coupons";

export interface CouponActionResult {
  code?: string;
  error?: string;
  success?: boolean;
}

function revalidateStorefront() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function applyCouponAction(
  code: string,
  email?: string
): Promise<CouponActionResult> {
  if (!code.trim()) {
    return { error: "Enter a coupon code." };
  }

  const [cart, session] = await Promise.all([
    getCartDetails(),
    getCurrentSession(),
  ]);
  if (!cart.cartId || cart.items.length === 0) {
    return { error: "Your bag is empty." };
  }

  try {
    const result = await applyCouponToCart({
      cartId: cart.cartId,
      code,
      items: cart.items,
      customer: {
        userId: session?.user?.id,
        email: session?.user?.email ?? email,
      },
    });
    if (!result.ok) {
      return { error: result.reason };
    }
    revalidateStorefront();
    return { success: true, code: result.code };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to apply coupon",
    };
  }
}

export async function removeCouponAction(): Promise<CouponActionResult> {
  const cart = await getCartDetails();
  if (cart.cartId) {
    await removeCouponFromCart(cart.cartId);
  }
  revalidateStorefront();
  return { success: true };
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : Number.NaN;
}

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveCouponAction(
  formData: FormData
): Promise<CouponActionResult> {
  const session = await requireAdmin();

  const discountType =
    formData.get("discountType") === "fixed" ? "fixed" : "percent";
  const scope = String(formData.get("appliesTo") || "all");
  const appliesTo =
    scope === "products" || scope === "categories" ? scope : "all";
  const rawValue = parseOptionalInt(formData.get("discountValue"));
  const rawMin = parseOptionalInt(formData.get("minOrder"));
  const rawMax = parseOptionalInt(formData.get("maxDiscount"));
  const usageLimit = parseOptionalInt(formData.get("usageLimit"));
  const perCustomer = parseOptionalInt(formData.get("perCustomerLimit"));

  const numbers = [rawValue, rawMin, rawMax, usageLimit, perCustomer];
  if (numbers.some((n) => n !== null && !Number.isInteger(n))) {
    return { error: "Numeric fields must be whole numbers." };
  }

  // Admin enters rupees for fixed amount / min order / max discount cap.
  const input: SaveCouponInput = {
    code: String(formData.get("code") || ""),
    description: String(formData.get("description") || ""),
    discountType,
    discountValue:
      discountType === "fixed" ? (rawValue ?? 0) * 100 : (rawValue ?? 0),
    minOrderMinor: (rawMin ?? 0) * 100,
    maxDiscountMinor: rawMax === null ? null : rawMax * 100,
    startsAt: parseOptionalDate(formData.get("startsAt")),
    expiresAt: parseOptionalDate(formData.get("expiresAt")),
    usageLimit,
    perCustomerLimit: perCustomer ?? 1,
    appliesTo,
    targets: [
      ...formData.getAll("productIds").map((id) => ({
        targetType: "product" as const,
        targetId: String(id),
      })),
      ...formData.getAll("categoryIds").map((id) => ({
        targetType: "category" as const,
        targetId: String(id),
      })),
      ...formData.getAll("collectionIds").map((id) => ({
        targetType: "collection" as const,
        targetId: String(id),
      })),
    ],
    active: formData.get("active") === "true",
    actorId: session.user.id,
  };

  try {
    const saved = await saveCoupon(input);
    revalidatePath("/admin/coupons");
    revalidateStorefront();
    return { success: true, code: saved.code };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to save coupon",
    };
  }
}

export async function toggleCouponAction(
  couponId: string,
  active: boolean
): Promise<CouponActionResult> {
  const session = await requireAdmin();
  await setCouponActive({ couponId, active, actorId: session.user.id });
  revalidatePath("/admin/coupons");
  revalidateStorefront();
  return { success: true };
}
