import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import {
  inventoryBalances,
  inventoryMovements,
  inventoryReservations,
  orderAddresses,
  orderItems,
  orders,
  paymentProofs,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { clearCart, getCartDetails } from "@/lib/commerce/cart";
import {
  getOrCreateDefaultLocation,
  getVariantStock,
} from "@/lib/commerce/inventory";
import {
  calculateInclusiveGst,
  calculateShippingFee,
  generateOrderNumber,
  isOrderStatus,
  isPincodeServiceable,
} from "@/lib/commerce/rules";
import { db } from "@/lib/db";

export { generateOrderNumber };

export interface ShippingAddressInput {
  city: string;
  countryCode?: string;
  line1: string;
  line2?: string;
  phone: string;
  postcode: string;
  recipient: string;
  state: string;
}

export interface CreateOrderParams {
  attribution?: Record<string, unknown>;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  paymentMethod?: "upi_qr" | "razorpay";
  shippingAddress: ShippingAddressInput;
  userId?: string;
}

/**
 * Creates an order snapshot directly from the customer's active cart.
 * Atomically creates inventory reservations for 15 minutes to guarantee stock while paying.
 */
export async function createOrderFromCart(params: CreateOrderParams) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod = "upi_qr",
    userId,
  } = params;

  if (!isPincodeServiceable(shippingAddress.postcode)) {
    throw new Error("Invalid or unserviceable Indian PIN code.");
  }

  const cart = await getCartDetails();
  if (cart.items.length === 0) {
    throw new Error("Cannot place an order with an empty shopping cart.");
  }

  const loc = await getOrCreateDefaultLocation();

  // Validate stock for all cart items before proceeding
  for (const item of cart.items) {
    const stock = await getVariantStock(item.variantId, loc.id);
    if (stock.available < item.quantity) {
      throw new Error(
        `Insufficient stock for "${item.productName} - ${item.variantTitle}". Only ${stock.available} available.`
      );
    }
  }

  // Calculate order money breakdown
  const subtotalMinor = cart.subtotalMinor;
  const shippingMinor = calculateShippingFee(subtotalMinor);
  const taxMinor = calculateInclusiveGst(subtotalMinor);
  const totalMinor = subtotalMinor + shippingMinor;

  const orderNumber = generateOrderNumber();
  const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock

  // Execute order creation in a database transaction
  return await db.transaction(async (tx) => {
    // 1. Insert order record
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId: userId || null,
        guestTokenHash: cart.cartId ? `cart_${cart.cartId}` : null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        currency: "INR",
        subtotalMinor,
        shippingMinor,
        taxMinor,
        totalMinor,
        status: "pending_payment",
        paymentStatus: "pending",
        paymentMethod,
        attribution: params.attribution || null,
      })
      .returning();

    // 2. Insert line items snapshot
    for (const item of cart.items) {
      await tx.insert(orderItems).values({
        orderId: order.id,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName,
        variantTitle: item.variantTitle,
        sku: item.sku,
        unitPriceMinor: item.unitPriceMinor || 0,
        quantity: item.quantity,
        lineTotalMinor: item.lineTotalMinor || 0,
        weightG: item.weightG || 300,
      });

      // 3. Atomically reserve inventory units
      await tx.insert(inventoryReservations).values({
        attemptId: order.id,
        variantId: item.variantId,
        locationId: loc.id,
        quantity: item.quantity,
        expiresAt: reservationExpiry,
        status: "active",
      });

      // Increment reserved balance
      await tx
        .update(inventoryBalances)
        .set({
          reserved: sql`${inventoryBalances.reserved} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryBalances.variantId, item.variantId),
            eq(inventoryBalances.locationId, loc.id)
          )
        );
    }

    // 4. Insert address snapshot
    await tx.insert(orderAddresses).values({
      orderId: order.id,
      type: "shipping",
      recipient: shippingAddress.recipient.trim(),
      phone: shippingAddress.phone.trim(),
      line1: shippingAddress.line1.trim(),
      line2: shippingAddress.line2?.trim() || null,
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      postcode: shippingAddress.postcode.trim(),
      countryCode: shippingAddress.countryCode || "IN",
    });

    await audit({
      action: "order.created",
      actorId: userId,
      entityType: "order",
      entityId: order.id,
      description: `Order ${orderNumber} created for ₹${(totalMinor / 100).toLocaleString("en-IN")}. Inventory reserved for 15 mins.`,
      metadata: {
        orderNumber,
        totalMinor,
        paymentMethod,
        itemCount: cart.items.length,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalMinor: order.totalMinor,
      totalRupees: order.totalMinor / 100,
      currency: order.currency,
      customerEmail: order.customerEmail,
      status: order.status,
    };
  });
}

export interface SubmitPaymentProofParams {
  cartIdToClear?: string;
  orderId: string;
  screenshotUrl: string;
  upiReference: string;
}

/**
 * Customer submits proof of direct UPI payment (UTR / transaction reference + screenshot).
 * Updates order to payment_review and clears active shopping bag.
 */
export async function submitPaymentProof(params: SubmitPaymentProofParams) {
  const { orderId, upiReference, screenshotUrl, cartIdToClear } = params;
  const cleanUtr = upiReference.trim().replace(/\s+/g, "");

  if (cleanUtr.length < 8) {
    throw new Error(
      "Please enter a valid UPI transaction reference / UTR number."
    );
  }

  if (!screenshotUrl) {
    throw new Error("Payment screenshot proof is required.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  return await db.transaction(async (tx) => {
    // Insert or update payment proof
    await tx.insert(paymentProofs).values({
      orderId: order.id,
      method: "upi_qr",
      amountMinor: order.totalMinor,
      currency: order.currency,
      upiReference: cleanUtr,
      screenshotUrl,
      status: "under_review",
    });

    // Advance order to payment_review
    await tx
      .update(orders)
      .set({
        status: "payment_review",
        paymentStatus: "under_review",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Clear the active customer cart
    await clearCart(cartIdToClear);

    await audit({
      action: "order.payment_proof_submitted",
      actorId: order.userId ?? undefined,
      entityType: "order",
      entityId: order.id,
      description: `Payment proof submitted for Order ${order.orderNumber} (UTR: ${cleanUtr}). Status set to payment_review.`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        upiReference: cleanUtr,
        screenshotUrl,
      },
    });

    return { success: true, orderNumber: order.orderNumber };
  });
}

/**
 * Admin action: Verifies customer's UPI bank transfer, permanently deducts stock,
 * and confirms the order.
 */
export async function verifyPaymentAndConfirmOrder(params: {
  orderId: string;
  adminId: string;
  reviewNote?: string;
}) {
  const { orderId, adminId, reviewNote } = params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const loc = await getOrCreateDefaultLocation();

  return await db.transaction(async (tx) => {
    // 1. Update payment proof status
    await tx
      .update(paymentProofs)
      .set({
        status: "verified",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: reviewNote?.trim() || "Payment verified by administrator",
        updatedAt: new Date(),
      })
      .where(eq(paymentProofs.orderId, order.id));

    // 2. Convert temporary reservation to permanent physical stock deduction
    for (const it of items) {
      // Release reservation
      await tx
        .update(inventoryReservations)
        .set({
          status: "consumed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryReservations.attemptId, order.id),
            eq(inventoryReservations.variantId, it.variantId)
          )
        );

      // Decrement on_hand AND decrement reserved
      await tx
        .update(inventoryBalances)
        .set({
          onHand: sql`${inventoryBalances.onHand} - ${it.quantity}`,
          reserved: sql`GREATEST(0, ${inventoryBalances.reserved} - ${it.quantity})`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryBalances.variantId, it.variantId),
            eq(inventoryBalances.locationId, loc.id)
          )
        );

      // Record immutable inventory movement log
      await tx.insert(inventoryMovements).values({
        variantId: it.variantId,
        locationId: loc.id,
        onHandDelta: -it.quantity,
        reservedDelta: -it.quantity,
        reason: `Payment verified for Order ${order.orderNumber}`,
        referenceType: "order_fulfilment",
        referenceId: order.id,
        actorId: adminId,
      });
    }

    // 3. Confirm order
    await tx
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "verified",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await audit({
      action: "order.payment_verified",
      actorId: adminId,
      entityType: "order",
      entityId: order.id,
      description: `Payment approved for Order ${order.orderNumber}. Inventory permanently deducted. Order confirmed.`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        verifiedBy: adminId,
      },
    });

    const { recordAnalyticsEvent } = await import("@/lib/commerce/campaigns");
    await recordAnalyticsEvent({
      eventName: "purchase_confirmed",
      orderId: order.id,
      campaignCode: readAttributionCampaignCode(order.attribution),
      dedupeKey: `purchase:${order.orderNumber}`,
      properties: {
        orderNumber: order.orderNumber,
        totalMinor: order.totalMinor,
      },
    });

    return { success: true, orderNumber: order.orderNumber };
  });
}

/**
 * Admin action: Rejects invalid or unreceived payment proof, and releases reserved stock.
 */
export async function rejectPaymentProof(params: {
  orderId: string;
  adminId: string;
  reason: string;
}) {
  const { orderId, adminId, reason } = params;

  if (!reason || reason.trim().length < 3) {
    throw new Error(
      "A clear rejection reason is required (e.g. 'UTR not found in bank statement')."
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const loc = await getOrCreateDefaultLocation();

  return await db.transaction(async (tx) => {
    // 1. Release all reservations back to available stock
    for (const it of items) {
      await tx
        .update(inventoryReservations)
        .set({
          status: "released",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryReservations.attemptId, order.id),
            eq(inventoryReservations.variantId, it.variantId)
          )
        );

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

    // 2. Mark proof as rejected
    await tx
      .update(paymentProofs)
      .set({
        status: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(paymentProofs.orderId, order.id));

    // 3. Mark order as cancelled or pending_payment
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "rejected",
        cancelReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await audit({
      action: "order.payment_rejected",
      actorId: adminId,
      entityType: "order",
      entityId: order.id,
      description: `Payment rejected for Order ${order.orderNumber}. Stock reservations released. Reason: ${reason}`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        rejectedBy: adminId,
        reason,
      },
    });

    return { success: true };
  });
}

/**
 * Admin action: Updates order shipping/fulfilment status (Processing, Shipped, Delivered).
 */
export async function updateOrderFulfillment(params: {
  orderId: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  trackingCourier?: string;
  trackingNumber?: string;
  adminId: string;
}) {
  const { orderId, status, trackingCourier, trackingNumber, adminId } = params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found.");
  }

  await db
    .update(orders)
    .set({
      status,
      trackingCourier: trackingCourier?.trim() || order.trackingCourier,
      trackingNumber: trackingNumber?.trim() || order.trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await audit({
    action: "order.status_updated",
    actorId: adminId,
    entityType: "order",
    entityId: orderId,
    description: `Order ${order.orderNumber} status updated to ${status}.`,
    metadata: {
      orderNumber: order.orderNumber,
      status,
      trackingCourier,
      trackingNumber,
    },
  });

  return { success: true };
}

/**
 * Loads detailed order information with line items, address, and payment proof.
 */
export async function getOrderDetails(orderIdOrNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.id} = ${orderIdOrNumber} OR ${orders.orderNumber} = ${orderIdOrNumber}`
    )
    .limit(1);

  if (!order) {
    return null;
  }

  const [items, [address], [proof]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db
      .select()
      .from(orderAddresses)
      .where(eq(orderAddresses.orderId, order.id))
      .limit(1),
    db
      .select()
      .from(paymentProofs)
      .where(eq(paymentProofs.orderId, order.id))
      .orderBy(desc(paymentProofs.createdAt))
      .limit(1),
  ]);

  return {
    order,
    items,
    address,
    proof: proof || null,
  };
}

function readAttributionCampaignCode(
  attribution: Record<string, unknown> | null
): string | null {
  const value = attribution?.campaignCode;
  return typeof value === "string" && value ? value : null;
}

/**
 * Loads order list for the admin dashboard with status filters.
 */
export async function getAdminOrders(params?: {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  /** Matches order number, customer name, email or phone. */
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const {
    status,
    paymentStatus,
    paymentMethod,
    search,
    limit = 50,
    offset = 0,
  } = params || {};

  let query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      totalMinor: orders.totalMinor,
      currency: orders.currency,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      trackingCourier: orders.trackingCourier,
      trackingNumber: orders.trackingNumber,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .$dynamic();

  const conditions: SQL[] = [];
  if (status && isOrderStatus(status)) {
    conditions.push(eq(orders.status, status));
  }
  const paymentStatusValue = orders.paymentStatus.enumValues.find(
    (value) => value === paymentStatus
  );
  if (paymentStatusValue) {
    conditions.push(eq(orders.paymentStatus, paymentStatusValue));
  }
  const paymentMethodValue = orders.paymentMethod.enumValues.find(
    (value) => value === paymentMethod
  );
  if (paymentMethodValue) {
    conditions.push(eq(orders.paymentMethod, paymentMethodValue));
  }
  const term = search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    const match = or(
      ilike(orders.orderNumber, pattern),
      ilike(orders.customerName, pattern),
      ilike(orders.customerEmail, pattern),
      ilike(orders.customerPhone, pattern)
    );
    if (match) {
      conditions.push(match);
    }
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
}

/**
 * Loads orders belonging to a registered customer.
 */
export async function getCustomerOrders(userId: string) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalMinor: orders.totalMinor,
      currency: orders.currency,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      trackingCourier: orders.trackingCourier,
      trackingNumber: orders.trackingNumber,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}
