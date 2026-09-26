"use server";

import { headers } from "next/headers";
import { SELLER_INFO } from "@/config/platform";
import { audit } from "@/lib/audit";
import { enqueueEmail } from "@/lib/email";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_POLICIES,
} from "@/lib/security/rate-limit";

/** Deliberately permissive — the confirmation mail is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Subscriber-supplied text lands in an HTML mail, so it is escaped first. */
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export async function subscribeToNewsletterAction(formData: FormData) {
  const h = await headers();
  const limitCheck = checkRateLimit(
    getClientIdentifier(h),
    "newsletter_signup",
    RATE_LIMIT_POLICIES.NEWSLETTER_SIGNUP
  );
  if (!limitCheck.success) {
    return {
      success: false,
      error: `Too many signups from this connection. Please wait ${Math.ceil(limitCheck.resetMs / 1000)} seconds.`,
    };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const consented = formData.get("consent") === "on";

  if (!(name && email)) {
    return { success: false, error: "Please provide your name and email." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "That email address does not look right." };
  }
  if (!consented) {
    return {
      success: false,
      error: "Please tick the box to confirm you want our emails.",
    };
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);

  try {
    // The store has no subscriber table yet, so the list lives in the support
    // inbox: one notice to the team, one welcome to the subscriber.
    await enqueueEmail({
      to: SELLER_INFO.supportEmail,
      subject: `Newsletter signup — ${name}`,
      html: `<p><strong>${safeName}</strong> subscribed to the Zencino newsletter.</p><p>Email: ${safeEmail}</p>`,
      text: `${name} subscribed to the Zencino newsletter.\nEmail: ${email}`,
    });

    await enqueueEmail({
      to: email,
      subject: "Welcome to Zencino",
      html: `<p>Hello ${safeName},</p><p>Thank you for subscribing. We will write when a new piece joins the collection — never more than that.</p><p>— The Zencino team</p>`,
      text: `Hello ${name},\n\nThank you for subscribing. We will write when a new piece joins the collection — never more than that.\n\n— The Zencino team`,
    });

    await audit({
      action: "newsletter.subscribed",
      actorEmail: email,
      description: `Newsletter signup from ${email}`,
      entityType: "newsletter",
      metadata: { email, name },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not complete the signup. Please try again.",
    };
  }
}
