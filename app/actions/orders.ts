"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/authz";
import {
  createOrderFromCart,
  rejectPaymentProof,
  submitPaymentProof,
  updateOrderFulfillment,
  verifyPaymentAndConfirmOrder,
} from "@/lib/commerce/orders";
import { generateQrCodeSvg, generateUpiUri, isValidUtr } from "@/lib/commerce/upi";
import { env } from "@/lib/env";

export interface CreateOrderResult {
  success?: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  totalRupees?: number;
  upiUri?: string;
  qrSvg?: string;
  upiId?: string;
  upiName?: string;
}

export async function createOrderAction(formData: FormData): Promise<CreateOrderResult> {
  try {
    const session = await getCurrentSession();

    const recipient = String(formData.get("recipient") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const line1 = String(formData.get("line1") || "").trim();
    const line2 = String(formData.get("line2") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const state = String(formData.get("state") || "").trim();
    const postcode = String(formData.get("postcode") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();

    if (!recipient || !phone || !line1 || !city || !state || !postcode || !customerEmail) {
      return { error: "Please complete all required delivery address and contact fields." };
    }

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const attributionCookie = cookieStore.get("zen_attribution")?.value;
    let attribution: Record<string, unknown> | undefined;
    if (attributionCookie) {
      try {
        attribution = JSON.parse(attributionCookie);
      } catch {
        attribution = { campaignCode: attributionCookie };
      }
    }

    const order = await createOrderFromCart({
      customerName: recipient,
      customerEmail,
      customerPhone: phone,
      shippingAddress: {
        recipient,
        phone,
        line1,
        line2: line2 || undefined,
        city,
        state,
        postcode,
        countryCode: "IN",
      },
      paymentMethod: env.PAYMENT_MODE as "upi_qr" | "razorpay",
      userId: session?.user?.id,
      attribution,
    });

    const upiId = env.UPI_ID;
    const upiName = env.UPI_NAME;

    const upiUri = generateUpiUri({
      upiId,
      upiName,
      amountRupees: order.totalRupees,
      orderNumber: order.orderNumber,
    });

    const qrSvg = await generateQrCodeSvg(upiUri);

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return {
      success: true,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      totalRupees: order.totalRupees,
      upiUri,
      qrSvg,
      upiId,
      upiName,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate order checkout";
    return { error: message };
  }
}

export interface PaymentProofResult {
  success?: boolean;
  error?: string;
  orderNumber?: string;
}

export async function submitPaymentProofAction(
  orderId: string,
  upiReference: string,
  screenshotUrl: string
): Promise<PaymentProofResult> {
  try {
    const cleanUtr = upiReference.trim().replace(/\s+/g, "");

    if (!isValidUtr(cleanUtr)) {
      return { error: "Please enter a valid 8 to 24 character UPI UTR or Transaction Reference number." };
    }

    if (!screenshotUrl) {
      return { error: "Please upload the payment transfer screenshot." };
    }

    const result = await submitPaymentProof({
      orderId,
      upiReference: cleanUtr,
      screenshotUrl,
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/admin/orders");
    revalidatePath("/account");

    return { success: true, orderNumber: result.orderNumber };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit payment proof";
    return { error: message };
  }
}

export async function verifyPaymentAction(
  orderId: string,
  reviewNote?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    await verifyPaymentAndConfirmOrder({
      orderId,
      adminId: admin.user.id,
      reviewNote,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/account");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return { error: message };
  }
}

export async function rejectPaymentAction(
  orderId: string,
  reason: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    await rejectPaymentProof({
      orderId,
      adminId: admin.user.id,
      reason,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/inventory");
    revalidatePath("/account");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reject payment proof";
    return { error: message };
  }
}

export async function updateOrderFulfillmentAction(
  orderId: string,
  status: "processing" | "shipped" | "delivered" | "cancelled",
  trackingCourier?: string,
  trackingNumber?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    await updateOrderFulfillment({
      orderId,
      status,
      trackingCourier,
      trackingNumber,
      adminId: admin.user.id,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/account");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update fulfillment status";
    return { error: message };
  }
}
