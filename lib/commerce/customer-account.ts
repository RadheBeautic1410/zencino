import { and, desc, eq, sql } from "drizzle-orm";
import {
  customerAddresses,
  orderAddresses,
  orderItems,
  orders,
  paymentProofs,
} from "@/db/schema";
import { isPincodeServiceable } from "@/lib/commerce/rules";
import { db } from "@/lib/db";

export interface AddressInput {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  countryCode?: string;
  isDefault?: boolean;
}

/**
 * Retrieves all saved addresses for an authenticated customer account.
 * Primary/default address is always returned first.
 */
export async function getCustomerAddresses(userId: string) {
  return db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, userId))
    .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
}

/**
 * Creates or updates a customer delivery address.
 * Automatically ensures only one address is flagged as default at any time.
 */
export async function saveCustomerAddress(params: {
  id?: string;
  userId: string;
  address: AddressInput;
}) {
  const { id, userId, address } = params;

  if (!isPincodeServiceable(address.postcode)) {
    throw new Error("Invalid or unserviceable Indian PIN code. Please enter a valid 6-digit PIN code.");
  }

  const cleanPhone = address.phone.trim().replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    throw new Error("Please enter a valid 10-digit mobile phone number.");
  }

  const cleanRecipient = address.recipient.trim();
  if (!cleanRecipient || cleanRecipient.length < 2) {
    throw new Error("Recipient name is required.");
  }

  const cleanLine1 = address.line1.trim();
  if (!cleanLine1 || cleanLine1.length < 5) {
    throw new Error("House / flat / street address details are required.");
  }

  return await db.transaction(async (tx) => {
    // Check existing addresses
    const existing = await tx
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, userId));

    const isFirstAddress = existing.length === 0;
    const shouldBeDefault = address.isDefault ?? isFirstAddress;

    // If making this address default, unset default on other addresses
    if (shouldBeDefault) {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(customerAddresses.userId, userId));
    }

    if (id) {
      // Update existing
      const [updated] = await tx
        .update(customerAddresses)
        .set({
          recipient: cleanRecipient,
          phone: cleanPhone,
          line1: cleanLine1,
          line2: address.line2?.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          postcode: address.postcode.trim(),
          countryCode: address.countryCode || "IN",
          isDefault: shouldBeDefault,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customerAddresses.id, id),
            eq(customerAddresses.userId, userId)
          )
        )
        .returning();

      return updated;
    }

    // Insert new
    const [inserted] = await tx
      .insert(customerAddresses)
      .values({
        userId,
        recipient: cleanRecipient,
        phone: cleanPhone,
        line1: cleanLine1,
        line2: address.line2?.trim() || null,
        city: address.city.trim(),
        state: address.state.trim(),
        postcode: address.postcode.trim(),
        countryCode: address.countryCode || "IN",
        isDefault: shouldBeDefault,
      })
      .returning();

    return inserted;
  });
}

/**
 * Deletes a saved address belonging to the user.
 */
export async function deleteCustomerAddress(addressId: string, userId: string) {
  const [deleted] = await db
    .delete(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.userId, userId)
      )
    )
    .returning();

  // If deleted address was default, set the oldest remaining address as default
  if (deleted?.isDefault) {
    const [oldest] = await db
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, userId))
      .orderBy(customerAddresses.createdAt)
      .limit(1);

    if (oldest) {
      await db
        .update(customerAddresses)
        .set({ isDefault: true })
        .where(eq(customerAddresses.id, oldest.id));
    }
  }

  return { success: true };
}

/**
 * Sets a specific address as the default address for the user.
 */
export async function setDefaultCustomerAddress(addressId: string, userId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(customerAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(customerAddresses.userId, userId));

    const [updated] = await tx
      .update(customerAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.userId, userId)
        )
      )
      .returning();

    return updated;
  });
}

/**
 * Loads order details with strict authorization check: customer can ONLY access their own orders.
 */
export async function getSecureCustomerOrder(userId: string, orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber.trim()),
        eq(orders.userId, userId)
      )
    )
    .limit(1);

  if (!order) return null;

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
    address: address || null,
    proof: proof || null,
  };
}

/**
 * Public guest order tracking lookup: Requires exact match on (orderNumber + email/phone).
 * Guards against order ID guessing attacks.
 */
export async function lookupGuestOrder(orderNumber: string, contactInput: string) {
  const cleanOrderNumber = orderNumber.trim();
  const cleanContact = contactInput.trim().toLowerCase();
  const cleanPhoneDigits = cleanContact.replace(/\D/g, "");

  if (!cleanOrderNumber || !cleanContact) {
    throw new Error("Both Order Reference and Contact Email/Phone are required.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, cleanOrderNumber))
    .limit(1);

  if (!order) {
    throw new Error("No order found matching the provided Order Number and contact details.");
  }

  const matchesEmail = order.customerEmail.toLowerCase() === cleanContact;
  const matchesPhone =
    cleanPhoneDigits.length >= 10 &&
    order.customerPhone.replace(/\D/g, "").endsWith(cleanPhoneDigits);

  if (!matchesEmail && !matchesPhone) {
    throw new Error("No order found matching the provided Order Number and contact details.");
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
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      trackingCourier: order.trackingCourier,
      trackingNumber: order.trackingNumber,
      totalMinor: order.totalMinor,
      currency: order.currency,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    },
    items,
    address: address || null,
    proof: proof
      ? {
          upiReference: proof.upiReference,
          status: proof.status,
        }
      : null,
  };
}
