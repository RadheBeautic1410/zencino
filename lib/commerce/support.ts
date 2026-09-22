import { and, desc, eq, ilike, or } from "drizzle-orm";
import { orders } from "@/db/schema/orders";
import {
  type SupportMessage,
  type SupportRequest,
  supportMessages,
  supportRequests,
} from "@/db/schema/support";
import { audit } from "@/lib/audit";
import { generateSupportTicketNumber } from "@/lib/commerce/rules";
import { db } from "@/lib/db";

export { generateSupportTicketNumber };

export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export function isSupportTicketStatus(
  value: string
): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}

export const SUPPORT_MESSAGE_VISIBILITIES = ["internal", "customer"] as const;

export type SupportMessageVisibility =
  (typeof SUPPORT_MESSAGE_VISIBILITIES)[number];

export function isSupportMessageVisibility(
  value: string
): value is SupportMessageVisibility {
  return (SUPPORT_MESSAGE_VISIBILITIES as readonly string[]).includes(value);
}

export async function createSupportInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  orderNumber?: string;
  userId?: string;
}): Promise<{ success: boolean; ticketNumber: string; requestId: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!name || !email || !subject || !body) {
    throw new Error("Name, email, subject, and message body are all required");
  }

  // Attempt to match order if orderNumber is provided
  let orderId: string | null = null;
  if (input.orderNumber) {
    const [matchedOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, input.orderNumber.trim().toUpperCase()))
      .limit(1);
    if (matchedOrder) {
      orderId = matchedOrder.id;
    }
  }

  const ticketNumber = generateSupportTicketNumber();

  return await db.transaction(async (tx) => {
    const [request] = await tx
      .insert(supportRequests)
      .values({
        ticketNumber,
        userId: input.userId ?? null,
        orderId,
        orderNumber: input.orderNumber
          ? input.orderNumber.trim().toUpperCase()
          : null,
        name,
        email,
        phone: input.phone ? input.phone.trim() : null,
        subject,
        body,
        status: "open",
        priority: "normal",
      })
      .returning();

    // Insert initial customer message in thread
    await tx.insert(supportMessages).values({
      requestId: request.id,
      authorId: input.userId ?? null,
      authorName: name,
      body,
      visibility: "customer",
      sentAt: new Date(),
    });

    await audit({
      action: "support.ticket_created",
      actorId: input.userId,
      actorEmail: email,
      entityType: "support_request",
      entityId: request.id,
      description: `Customer support ticket ${ticketNumber} created by ${email}`,
      metadata: {
        ticketNumber,
        subject,
        orderNumber: input.orderNumber,
      },
    });

    return {
      success: true,
      ticketNumber: request.ticketNumber,
      requestId: request.id,
    };
  });
}

export async function addSupportMessage(input: {
  requestId: string;
  body: string;
  visibility: SupportMessageVisibility;
  authorId?: string;
  authorName: string;
  actorEmail?: string;
}): Promise<SupportMessage> {
  const body = input.body.trim();
  if (!body) {
    throw new Error("Message body cannot be empty");
  }

  return await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, input.requestId))
      .limit(1);

    if (!request) {
      throw new Error("Support ticket not found");
    }

    const now = new Date();
    const [message] = await tx
      .insert(supportMessages)
      .values({
        requestId: request.id,
        authorId: input.authorId ?? null,
        authorName: input.authorName,
        body,
        visibility: input.visibility,
        sentAt: input.visibility === "customer" ? now : null,
      })
      .returning();

    // Auto-advance status from open to in_progress if customer reply sent
    const newStatus =
      request.status === "open" && input.visibility === "customer"
        ? "in_progress"
        : request.status;

    await tx
      .update(supportRequests)
      .set({
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(supportRequests.id, request.id));

    await audit({
      action:
        input.visibility === "internal"
          ? "support.internal_note_added"
          : "support.customer_reply_sent",
      actorId: input.authorId,
      actorEmail: input.actorEmail,
      entityType: "support_request",
      entityId: request.id,
      description: `Added ${input.visibility} message to ticket ${request.ticketNumber}`,
      metadata: {
        ticketNumber: request.ticketNumber,
        visibility: input.visibility,
      },
    });

    return message;
  });
}

export async function updateSupportTicketStatus(input: {
  requestId: string;
  status: SupportTicketStatus;
  actorId?: string;
  actorEmail?: string;
}): Promise<SupportRequest> {
  const [request] = await db
    .select()
    .from(supportRequests)
    .where(eq(supportRequests.id, input.requestId))
    .limit(1);

  if (!request) {
    throw new Error("Support ticket not found");
  }

  const [updated] = await db
    .update(supportRequests)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(supportRequests.id, request.id))
    .returning();

  await audit({
    action: "support.status_updated",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    entityType: "support_request",
    entityId: request.id,
    description: `Support ticket ${request.ticketNumber} status changed to ${input.status}`,
    metadata: {
      ticketNumber: request.ticketNumber,
      previousStatus: request.status,
      newStatus: input.status,
    },
  });

  return updated;
}

export async function getSupportTicketsList(filter?: {
  status?: string;
  search?: string;
}): Promise<SupportRequest[]> {
  const conditions = [];

  if (filter?.status && isSupportTicketStatus(filter.status)) {
    conditions.push(eq(supportRequests.status, filter.status));
  }

  if (filter?.search) {
    const q = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(supportRequests.ticketNumber, q),
        ilike(supportRequests.name, q),
        ilike(supportRequests.email, q),
        ilike(supportRequests.subject, q)
      )
    );
  }

  const query = db
    .select()
    .from(supportRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(supportRequests.createdAt));

  return await query;
}

export async function getSupportTicketDetails(
  requestIdOrNumber: string
): Promise<{
  ticket: SupportRequest | null;
  messages: SupportMessage[];
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalMinor: number;
    createdAt: Date;
  } | null;
}> {
  const [ticket] = await db
    .select()
    .from(supportRequests)
    .where(
      or(
        eq(supportRequests.id, requestIdOrNumber),
        eq(supportRequests.ticketNumber, requestIdOrNumber.toUpperCase())
      )
    )
    .limit(1);

  if (!ticket) {
    return { ticket: null, messages: [], order: null };
  }

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.requestId, ticket.id))
    .orderBy(supportMessages.createdAt);

  let order = null;
  if (ticket.orderId) {
    const [ord] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalMinor: orders.totalMinor,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, ticket.orderId))
      .limit(1);
    order = ord ?? null;
  }

  return { ticket, messages, order };
}
