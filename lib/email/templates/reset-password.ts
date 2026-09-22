import { createElement } from "react";
import { PRODUCT_NAME } from "@/config/platform";
import { ResetPasswordEmail } from "@/lib/email/components/reset-password";
import { renderEmailTemplate } from "@/lib/email/renderer";

export async function resetPasswordTemplate({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const html = await renderEmailTemplate(
    createElement(ResetPasswordEmail, {
      email,
      resetUrl,
      productName: PRODUCT_NAME,
    })
  );

  const text = `Reset your ${PRODUCT_NAME} password

We received a request to reset the password for ${email}.
Use this link to choose a new password:
${resetUrl}

This link expires in 1 hour and can only be used once. If you did not request this, you can ignore this email.`;

  return { html, text };
}
