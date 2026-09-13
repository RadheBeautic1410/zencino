"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/authz";
import {
  addSupportMessage,
  createSupportInquiry,
  updateSupportTicketStatus,
} from "@/lib/commerce/support";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit";

export async function submitSupportInquiryAction(formData: FormData) {
  const h = await headers();
  const clientId = getClientIdentifier(h);
  const limitCheck = checkRateLimit(clientId, "support_inquiry", RATE_LIMIT_POLICIES.SUPPORT_INQUIRY);
  if (!limitCheck.success) {
    return {
      success: false,
      error: `Too many inquiries submitted. Please wait ${Math.ceil(limitCheck.resetMs / 1000)} seconds before trying again.`,
    };
  }

  const session = await auth.api.getSession({ headers: h }).catch(() => null);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || undefined;
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const orderNumber = String(formData.get("orderNumber") || "").trim() || undefined;

  if (!name || !email || !subject || !body) {
    return { success: false, error: "Please provide your name, email, subject, and message." };
  }

  try {
    const result = await createSupportInquiry({
      name,
      email,
      phone,
      subject,
      body,
      orderNumber,
      userId: session?.user?.id,
    });

    revalidatePath("/admin/support");
    return { success: true, ticketNumber: result.ticketNumber };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit inquiry" };
  }
}

export async function addSupportMessageAction(formData: FormData) {
  const session = await requireAdmin();

  const requestId = String(formData.get("requestId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const visibility = (String(formData.get("visibility") || "customer") as any) || "customer";

  if (!requestId || !body) {
    return { success: false, error: "Ticket ID and message body are required" };
  }

  try {
    await addSupportMessage({
      requestId,
      body,
      visibility,
      authorId: session.user.id,
      authorName: session.user.name || session.user.email || "Support Team",
      actorEmail: session.user.email,
    });

    revalidatePath("/admin/support");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add message" };
  }
}

export async function updateTicketStatusAction(formData: FormData) {
  const session = await requireAdmin();

  const requestId = String(formData.get("requestId") || "").trim();
  const status = String(formData.get("status") || "open") as any;

  if (!requestId) {
    return { success: false, error: "Ticket ID is required" };
  }

  try {
    await updateSupportTicketStatus({
      requestId,
      status,
      actorId: session.user.id,
      actorEmail: session.user.email,
    });

    revalidatePath("/admin/support");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status" };
  }
}
