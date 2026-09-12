import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  inventoryBalances,
  inventoryReservations,
  orderAddresses,
  orderCancellations,
  orderItems,
  orderRefunds,
  orderReturns,
  orders,
  productVariants,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { adjustStock, getOrCreateDefaultLocation } from "@/lib/commerce/inventory";
import {
  canTransitionOrderStatus,
  generateCreditNoteNumber,
  generateRefundNumber,
  generateReturnNumber,
  isReturnEligible,
} from "@/lib/commerce/rules";
import { db } from "@/lib/db";

export interface RequestCancellationParams {
  orderId: string;
  userId?: string;
  requestedBy?: "customer" | "admin";
  reason: string;
}

/**
 * Customer or Admin initiates order cancellation.
 * If order is not yet paid or is pending review, cancels immediately and releases reservations.
 * If order is already confirmed / processing, queues cancellation request for operator review.
 */
export async function requestOrderCancellation(params: RequestCancellationParams) {
  const { orderId, userId, requestedBy = "customer", reason } = params;
  const cleanReason = reason.trim();

  if (!cleanReason || cleanReason.length < 3) {
    throw new Error("A reason for order cancellation is required.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status === "cancelled") {
    throw new Error("Order is already cancelled.");
  }

  if (order.status === "shipped" || order.status === "delivered") {
    throw new Error(
      "Orders that have already been dispatched cannot be cancelled directly. Please submit a return request once delivered."
    );
  }

  return await db.transaction(async (tx) => {
    // If unpaid or admin direct cancellation, execute immediately
    const canCancelImmediately =
      requestedBy === "admin" ||
      order.status === "pending_payment" ||
      order.status === "payment_review";

    if (canCancelImmediately) {
      // Release any active stock reservations
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const loc = await getOrCreateDefaultLocation();

      for (const it of items) {
        // Release reservation
        await tx
          .update(inventoryReservations)
          .set({ status: "released", updatedAt: new Date() })
          .where(
            and(
              eq(inventoryReservations.attemptId, order.id),
              eq(inventoryReservations.variantId, it.variantId)
            )
          );

        // If order was already confirmed (stock was deducted), restore physical stock
        if (order.status === "confirmed" || order.status === "processing") {
          await adjustStock({
            variantId: it.variantId,
            onHandDelta: it.quantity,
            reason: `Order ${order.orderNumber} cancelled by ${requestedBy}. Physical stock restored.`,
            referenceType: "cancellation_restock",
            referenceId: order.orderNumber,
            actorId: userId,
          });
        } else {
          // Unreserve reserved stock balance
          await tx
            .update(inventoryBalances)
            .set({
              reserved: sql`GREATEST(0, ${inventoryBalances.reserved} - ${it.quantity})`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(inventoryBalances.variantId, it.variantId),
                eq(inventoryBalances.locationId, loc.id)
              )
            );
        }
      }

      // Mark order cancelled
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          cancelReason: cleanReason,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      // Record cancellation
      const [cancellation] = await tx
        .insert(orderCancellations)
        .values({
          orderId: order.id,
          userId: userId || null,
          requestedBy,
          reason: cleanReason,
          status: "approved",
          adminNote: `Directly cancelled by ${requestedBy}.`,
          reviewedBy: userId || null,
          reviewedAt: new Date(),
        })
        .returning();

      await audit({
        action: "order.cancelled",
        actorId: userId,
        entityType: "order",
        entityId: order.id,
        description: `Order ${order.orderNumber} cancelled (${cleanReason}). Stock restored/released.`,
      });

      return {
        immediate: true,
        cancellationId: cancellation.id,
        orderNumber: order.orderNumber,
      };
    }

    // Customer requesting cancellation for confirmed / processing order
    const [cancellation] = await tx
      .insert(orderCancellations)
      .values({
        orderId: order.id,
        userId: userId || null,
        requestedBy: "customer",
        reason: cleanReason,
        status: "requested",
      })
      .returning();

    await audit({
      action: "order.cancellation_requested",
      actorId: userId,
      entityType: "order",
      entityId: order.id,
      description: `Customer requested cancellation for Order ${order.orderNumber}: ${cleanReason}`,
    });

    return {
      immediate: false,
      cancellationId: cancellation.id,
      orderNumber: order.orderNumber,
    };
  });
}

/**
 * Admin approves a customer cancellation request.
 * Restores sellable inventory and marks order cancelled.
 */
export async function approveOrderCancellation(params: {
  cancellationId: string;
  adminId: string;
  adminNote?: string;
}) {
  const { cancellationId, adminId, adminNote } = params;

  const [cancellation] = await db
    .select()
    .from(orderCancellations)
    .where(eq(orderCancellations.id, cancellationId))
    .limit(1);

  if (!cancellation) {
    throw new Error("Cancellation request not found.");
  }

  if (cancellation.status !== "requested") {
    throw new Error(`Cancellation is already ${cancellation.status}.`);
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, cancellation.orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return await db.transaction(async (tx) => {
    // Restore stock if payment was verified / items were confirmed
    for (const it of items) {
      await adjustStock({
        variantId: it.variantId,
        onHandDelta: it.quantity,
        reason: `Order ${order.orderNumber} cancellation approved. Stock restored.`,
        referenceType: "cancellation_restock",
        referenceId: order.orderNumber,
        actorId: adminId,
      });
    }

    await tx
      .update(orders)
      .set({
        status: "cancelled",
        cancelReason: cancellation.reason,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await tx
      .update(orderCancellations)
      .set({
        status: "approved",
        adminNote: adminNote?.trim() || "Approved by operator.",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orderCancellations.id, cancellation.id));

    await audit({
      action: "order.cancellation_approved",
      actorId: adminId,
      entityType: "order",
      entityId: order.id,
      description: `Operator approved cancellation for Order ${order.orderNumber}. Inventory restored.`,
    });

    return { success: true, orderNumber: order.orderNumber };
  });
}

/**
 * Admin rejects a customer cancellation request.
 */
export async function rejectOrderCancellation(params: {
  cancellationId: string;
  adminId: string;
  adminNote: string;
}) {
  const { cancellationId, adminId, adminNote } = params;

  if (!adminNote?.trim()) {
    throw new Error("A reason for rejecting the cancellation is required.");
  }

  const [cancellation] = await db
    .select()
    .from(orderCancellations)
    .where(eq(orderCancellations.id, cancellationId))
    .limit(1);

  if (!cancellation) {
    throw new Error("Cancellation request not found.");
  }

  await db
    .update(orderCancellations)
    .set({
      status: "rejected",
      adminNote: adminNote.trim(),
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orderCancellations.id, cancellation.id));

  return { success: true };
}

export interface RequestItemReturnParams {
  orderId: string;
  orderItemId: string;
  userId?: string;
  quantity: number;
  reason: "damaged_in_transit" | "wrong_item" | "defective_quality" | "not_as_described" | "other";
  customerNote?: string;
  photos?: string[];
}

/**
 * Customer submits a return/replacement claim for an item in a delivered order.
 * Strictly enforces 7-day policy window and photo proof requirement for transit damage.
 */
export async function requestItemReturn(params: RequestItemReturnParams) {
  const {
    orderId,
    orderItemId,
    userId,
    quantity,
    reason,
    customerNote,
    photos = [],
  } = params;

  if (!quantity || quantity <= 0) {
    throw new Error("Please specify a valid return quantity.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  // Enforce 7-day delivery policy
  const eligibility = isReturnEligible(order.status, order.deliveredAt);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "This order is not eligible for return.");
  }

  // Find line item
  const [item] = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.id, orderItemId), eq(orderItems.orderId, order.id)))
    .limit(1);

  if (!item) {
    throw new Error("Order line item not found.");
  }

  if (quantity > item.quantity) {
    throw new Error(`Cannot return ${quantity} units. Only ${item.quantity} purchased.`);
  }

  // Transit damage and defects require unboxing photo proof
  if (
    (reason === "damaged_in_transit" || reason === "defective_quality") &&
    photos.length === 0
  ) {
    throw new Error(
      "Photo proof of damaged package or defective item is required for transit replacement claims."
    );
  }

  const refundAmountMinor = item.unitPriceMinor * quantity;
  const returnNumber = generateReturnNumber();

  const [inserted] = await db
    .insert(orderReturns)
    .values({
      returnNumber,
      orderId: order.id,
      orderItemId: item.id,
      variantId: item.variantId,
      userId: userId || null,
      quantity,
      reason,
      customerNote: customerNote?.trim() || null,
      photos,
      status: "requested",
      refundAmountMinor,
    })
    .returning();

  await audit({
    action: "order.return_requested",
    actorId: userId,
    entityType: "order_return",
    entityId: inserted.id,
    description: `Return ${returnNumber} requested for ${quantity}x "${item.productName}" (Reason: ${reason}).`,
  });

  return inserted;
}

/**
 * Admin operator reviews customer return request.
 */
export async function reviewReturnRequest(params: {
  returnId: string;
  adminId: string;
  status: "approved" | "rejected";
  adminNote?: string;
}) {
  const { returnId, adminId, status, adminNote } = params;

  const [ret] = await db
    .select()
    .from(orderReturns)
    .where(eq(orderReturns.id, returnId))
    .limit(1);

  if (!ret) {
    throw new Error("Return request not found.");
  }

  if (ret.status !== "requested") {
    throw new Error(`Return is already in '${ret.status}' status.`);
  }

  const [updated] = await db
    .update(orderReturns)
    .set({
      status,
      adminNote: adminNote?.trim() || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orderReturns.id, ret.id))
    .returning();

  await audit({
    action: `order.return_${status}`,
    actorId: adminId,
    entityType: "order_return",
    entityId: ret.id,
    description: `Return ${ret.returnNumber} was ${status} by operator.`,
  });

  return updated;
}

/**
 * Admin operator confirms physical return receipt and performs QA inspection:
 * - Option 'restocked': sellable condition, restores physical units into inventory balances.
 * - Option 'scrapped': damaged/broken acrylic, physical stock is NOT restored.
 * Idempotent: cannot restock twice!
 */
export async function receiveAndInspectReturn(params: {
  returnId: string;
  adminId: string;
  restockAction: "restocked" | "scrapped";
  adminNote?: string;
}) {
  const { returnId, adminId, restockAction, adminNote } = params;

  const [ret] = await db
    .select()
    .from(orderReturns)
    .where(eq(orderReturns.id, returnId))
    .limit(1);

  if (!ret) {
    throw new Error("Return record not found.");
  }

  if (ret.restockAction !== "none") {
    throw new Error(
      `Inventory has already been processed for this return (${ret.restockAction}). Duplicate stock adjustment blocked.`
    );
  }

  return await db.transaction(async (tx) => {
    if (restockAction === "restocked") {
      // Restore physical sellable stock
      await adjustStock({
        variantId: ret.variantId,
        onHandDelta: ret.quantity,
        reason: `Customer return ${ret.returnNumber} inspected and restocked as sellable.`,
        referenceType: "return_restock",
        referenceId: ret.returnNumber,
        actorId: adminId,
      });
    }

    const [updated] = await tx
      .update(orderReturns)
      .set({
        status: "received",
        restockAction,
        receivedAt: new Date(),
        adminNote: adminNote?.trim() || ret.adminNote,
        updatedAt: new Date(),
      })
      .where(eq(orderReturns.id, ret.id))
      .returning();

    await audit({
      action: "order.return_inspected",
      actorId: adminId,
      entityType: "order_return",
      entityId: ret.id,
      description: `Return ${ret.returnNumber} inspected. Outcome: ${restockAction} (${ret.quantity} units).`,
    });

    return updated;
  });
}

export interface IssueOrderRefundParams {
  orderId: string;
  returnId?: string;
  cancellationId?: string;
  amountMinor: number;
  transactionReference: string;
  reason: string;
  adminId: string;
}

/**
 * Issues an audited financial refund and generates a statutory GST Credit Note (CN-YYYYMMDD-XXXX).
 * Invariant: cumulative refunds cannot exceed original order amount paid.
 */
export async function issueOrderRefund(params: IssueOrderRefundParams) {
  const {
    orderId,
    returnId,
    cancellationId,
    amountMinor,
    transactionReference,
    reason,
    adminId,
  } = params;

  const cleanUtr = transactionReference.trim();
  if (!cleanUtr || cleanUtr.length < 6) {
    throw new Error("Valid bank refund transaction reference / UTR is required.");
  }

  if (!amountMinor || amountMinor <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  // Calculate cumulative existing refunds
  const existingRefunds = await db
    .select({ amountMinor: orderRefunds.amountMinor })
    .from(orderRefunds)
    .where(eq(orderRefunds.orderId, order.id));

  const alreadyRefundedMinor = existingRefunds.reduce(
    (sum, r) => sum + r.amountMinor,
    0
  );

  if (alreadyRefundedMinor + amountMinor > order.totalMinor) {
    const remainingMinor = order.totalMinor - alreadyRefundedMinor;
    throw new Error(
      `Cannot refund ₹${(amountMinor / 100).toFixed(2)}. Maximum refundable balance is ₹${(remainingMinor / 100).toFixed(2)}.`
    );
  }

  const refundNumber = generateRefundNumber();
  const creditNoteNumber = generateCreditNoteNumber();

  return await db.transaction(async (tx) => {
    // 1. Record refund
    const [refund] = await tx
      .insert(orderRefunds)
      .values({
        refundNumber,
        orderId: order.id,
        returnId: returnId || null,
        cancellationId: cancellationId || null,
        amountMinor,
        currency: order.currency,
        reason: reason.trim(),
        method: "upi_reversal",
        transactionReference: cleanUtr,
        creditNoteNumber,
        status: "completed",
        processedBy: adminId,
        processedAt: new Date(),
      })
      .returning();

    // 2. Update return status if associated
    if (returnId) {
      await tx
        .update(orderReturns)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orderReturns.id, returnId));
    }

    // 3. Update cancellation status if associated
    if (cancellationId) {
      await tx
        .update(orderCancellations)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(orderCancellations.id, cancellationId));
    }

    // 4. Update order payment status to refunded
    const isFullRefund = alreadyRefundedMinor + amountMinor >= order.totalMinor;
    await tx
      .update(orders)
      .set({
        paymentStatus: isFullRefund ? "refunded" : "verified",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await audit({
      action: "order.refund_issued",
      actorId: adminId,
      entityType: "order_refund",
      entityId: refund.id,
      description: `Refund ${refundNumber} issued for ₹${(amountMinor / 100).toFixed(2)} (UTR: ${cleanUtr}). Credit Note: ${creditNoteNumber}.`,
    });

    return refund;
  });
}

/**
 * Admin updates order fulfillment status with state machine verification:
 * Sets dispatchedAt when transitioning to 'shipped'.
 * Sets deliveredAt when transitioning to 'delivered'.
 */
export async function updateOrderFulfillmentWithTransitions(params: {
  orderId: string;
  adminId: string;
  status: string;
  trackingCourier?: string;
  trackingNumber?: string;
}) {
  const { orderId, adminId, status, trackingCourier, trackingNumber } = params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!canTransitionOrderStatus(order.status, status, order.paymentStatus)) {
    throw new Error(
      `Illegal transition from '${order.status}' to '${status}' (Payment: ${order.paymentStatus}).`
    );
  }

  const updateData: Record<string, any> = {
    status,
    trackingCourier: trackingCourier?.trim() || order.trackingCourier,
    trackingNumber: trackingNumber?.trim() || order.trackingNumber,
    updatedAt: new Date(),
  };

  if (status === "shipped" && !order.dispatchedAt) {
    updateData.dispatchedAt = new Date();
  }
  if (status === "delivered" && !order.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const [updated] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, order.id))
    .returning();

  await audit({
    action: "order.status_updated",
    actorId: adminId,
    entityType: "order",
    entityId: order.id,
    description: `Fulfillment status changed: ${order.status} -> ${status}. Carrier: ${updateData.trackingCourier || "N/A"}.`,
  });

  return updated;
}

/**
 * Loads all return requests and credit notes for an order.
 */
export async function getOrderReturnAndRefundDetails(orderId: string) {
  const [returnsList, refundsList, cancellationsList] = await Promise.all([
    db
      .select({
        id: orderReturns.id,
        returnNumber: orderReturns.returnNumber,
        orderItemId: orderReturns.orderItemId,
        variantId: orderReturns.variantId,
        quantity: orderReturns.quantity,
        reason: orderReturns.reason,
        customerNote: orderReturns.customerNote,
        photos: orderReturns.photos,
        status: orderReturns.status,
        restockAction: orderReturns.restockAction,
        refundAmountMinor: orderReturns.refundAmountMinor,
        adminNote: orderReturns.adminNote,
        createdAt: orderReturns.createdAt,
        productName: orderItems.productName,
        variantTitle: orderItems.variantTitle,
        sku: orderItems.sku,
        unitPriceMinor: orderItems.unitPriceMinor,
      })
      .from(orderReturns)
      .leftJoin(orderItems, eq(orderReturns.orderItemId, orderItems.id))
      .where(eq(orderReturns.orderId, orderId))
      .orderBy(desc(orderReturns.createdAt)),

    db
      .select()
      .from(orderRefunds)
      .where(eq(orderRefunds.orderId, orderId))
      .orderBy(desc(orderRefunds.createdAt)),

    db
      .select()
      .from(orderCancellations)
      .where(eq(orderCancellations.orderId, orderId))
      .orderBy(desc(orderCancellations.createdAt)),
  ]);

  return {
    returns: returnsList,
    refunds: refundsList,
    cancellations: cancellationsList,
  };
}

/**
 * Retrieves all returns across the store for the admin operational exception queue.
 */
export async function getAllAdminReturns(statusFilter?: string) {
  let query = db
    .select({
      id: orderReturns.id,
      returnNumber: orderReturns.returnNumber,
      orderId: orderReturns.orderId,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      quantity: orderReturns.quantity,
      reason: orderReturns.reason,
      status: orderReturns.status,
      restockAction: orderReturns.restockAction,
      refundAmountMinor: orderReturns.refundAmountMinor,
      photos: orderReturns.photos,
      createdAt: orderReturns.createdAt,
      productName: orderItems.productName,
      variantTitle: orderItems.variantTitle,
      sku: orderItems.sku,
    })
    .from(orderReturns)
    .innerJoin(orders, eq(orderReturns.orderId, orders.id))
    .innerJoin(orderItems, eq(orderReturns.orderItemId, orderItems.id))
    .$dynamic();

  if (statusFilter && statusFilter !== "all") {
    query = query.where(eq(orderReturns.status, statusFilter as any));
  }

  return query.orderBy(desc(orderReturns.createdAt)).limit(100);
}
