"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/authz";
import {
  approveOrderCancellation,
  isReturnReason,
  issueOrderRefund,
  receiveAndInspectReturn,
  rejectOrderCancellation,
  requestItemReturn,
  requestOrderCancellation,
  reviewReturnRequest,
  updateOrderFulfillmentWithTransitions,
} from "@/lib/commerce/returns";
import { isOrderStatus } from "@/lib/commerce/rules";

export interface ReturnActionResult {
  data?: unknown;
  error?: string;
  success?: boolean;
}

export async function requestCancellationAction(
  formData: FormData
): Promise<ReturnActionResult> {
  try {
    const session = await getCurrentSession();
    const orderId = String(formData.get("orderId") || "").trim();
    const reason = String(formData.get("reason") || "").trim();

    if (!orderId || !reason) {
      return { error: "Order ID and cancellation reason are required." };
    }

    const result = await requestOrderCancellation({
      orderId,
      userId: session?.user?.id,
      requestedBy: session?.user?.role === "admin" ? "admin" : "customer",
      reason,
    });

    revalidatePath(`/account/orders/${result.orderNumber}`);
    revalidatePath("/account");
    revalidatePath("/admin/orders");

    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit cancellation";
    return { error: message };
  }
}

export async function approveCancellationAction(
  cancellationId: string,
  adminNote?: string
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    const res = await approveOrderCancellation({
      cancellationId,
      adminId: admin.user.id,
      adminNote,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/account/orders/${res.orderNumber}`);

    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to approve cancellation";
    return { error: message };
  }
}

export async function rejectCancellationAction(
  cancellationId: string,
  adminNote: string
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    await rejectOrderCancellation({
      cancellationId,
      adminId: admin.user.id,
      adminNote,
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reject cancellation";
    return { error: message };
  }
}

export async function requestReturnAction(
  formData: FormData
): Promise<ReturnActionResult> {
  try {
    const session = await getCurrentSession();
    const orderId = String(formData.get("orderId") || "").trim();
    const orderItemId = String(formData.get("orderItemId") || "").trim();
    const quantity = Number.parseInt(
      String(formData.get("quantity") || "1"),
      10
    );
    const reason = String(formData.get("reason") || "").trim();
    const customerNote = String(formData.get("customerNote") || "").trim();
    const photosJson = String(formData.get("photos") || "[]");

    let photos: string[] = [];
    try {
      photos = JSON.parse(photosJson);
    } catch {
      photos = [];
    }

    if (!(orderId && orderItemId && reason)) {
      return { error: "Order ID, line item, and return reason are required." };
    }

    if (!isReturnReason(reason)) {
      return { error: "Unknown return reason." };
    }

    const ret = await requestItemReturn({
      orderId,
      orderItemId,
      userId: session?.user?.id,
      quantity,
      reason,
      customerNote,
      photos,
    });

    revalidatePath("/account");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/returns");

    return { success: true, data: ret };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to request return";
    return { error: message };
  }
}

export async function reviewReturnAction(
  returnId: string,
  status: "approved" | "rejected",
  adminNote?: string
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    const res = await reviewReturnRequest({
      returnId,
      adminId: admin.user.id,
      status,
      adminNote,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/returns");
    return { success: true, data: res };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to review return";
    return { error: message };
  }
}

export async function inspectReturnAction(
  returnId: string,
  restockAction: "restocked" | "scrapped",
  adminNote?: string
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    const res = await receiveAndInspectReturn({
      returnId,
      adminId: admin.user.id,
      restockAction,
      adminNote,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/returns");
    revalidatePath("/admin/inventory");
    return { success: true, data: res };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to inspect return";
    return { error: message };
  }
}

export async function processRefundAction(
  formData: FormData
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    const orderId = String(formData.get("orderId") || "").trim();
    const returnId = String(formData.get("returnId") || "").trim() || undefined;
    const cancellationId =
      String(formData.get("cancellationId") || "").trim() || undefined;
    const amountRupees = Number.parseFloat(
      String(formData.get("amountRupees") || "0")
    );
    const transactionReference = String(
      formData.get("transactionReference") || ""
    ).trim();
    const reason = String(formData.get("reason") || "").trim();

    if (!orderId || !transactionReference || amountRupees <= 0) {
      return {
        error: "Order ID, bank UTR reference, and refund amount are required.",
      };
    }

    const amountMinor = Math.round(amountRupees * 100);

    const refund = await issueOrderRefund({
      orderId,
      returnId,
      cancellationId,
      amountMinor,
      transactionReference,
      reason,
      adminId: admin.user.id,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/returns");
    revalidatePath(`/orders/${orderId}/invoice`);

    return { success: true, data: refund };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process refund";
    return { error: message };
  }
}

export async function updateFulfillmentAction(
  formData: FormData
): Promise<ReturnActionResult> {
  try {
    const admin = await requireAdmin();
    const orderId = String(formData.get("orderId") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const trackingCourier = String(
      formData.get("trackingCourier") || ""
    ).trim();
    const trackingNumber = String(formData.get("trackingNumber") || "").trim();

    if (!(orderId && status)) {
      return { error: "Order ID and target status are required." };
    }

    if (!isOrderStatus(status)) {
      return { error: "Unknown fulfillment status." };
    }

    const updated = await updateOrderFulfillmentWithTransitions({
      orderId,
      adminId: admin.user.id,
      status,
      trackingCourier,
      trackingNumber,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/account/orders/${updated.orderNumber}`);
    revalidatePath("/track-order");

    return { success: true, data: updated };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update fulfillment";
    return { error: message };
  }
}
