import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";
import { PRODUCT_NAME } from "@/config/platform";
import * as schema from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { magicLinkTemplate } from "@/lib/email/templates/magic-link";
import { env } from "@/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.APP_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  disabledPaths: ["/admin/impersonate-user"],
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: false,
      sendChangeEmailConfirmation: async ({ user, url }) => {
        await enqueueEmail({
          to: user.email,
          subject: "Confirm your Zencino email change",
          html: `<p>Confirm your email change using <a href="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">this secure link</a>.</p>`,
          text: `Confirm your email change: ${url}`,
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await enqueueEmail({
        to: user.email,
        subject: "Verify your Zencino email address",
        html: `<p>Verify your email using <a href="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">this secure link</a>.</p>`,
        text: `Verify your email: ${url}`,
      });
    },
  },
  plugins: [
    admin({
      impersonationSessionDuration: 3600,
      allowImpersonatingAdmins: false,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { html, text } = await magicLinkTemplate({
          email,
          magicLinkUrl: url,
        });

        await enqueueEmail({
          to: email,
          subject: `Sign in to ${PRODUCT_NAME}`,
          html,
          text,
        });

        await audit({
          action: "auth.magic_link_sent",
          actorEmail: email,
          description: `Magic link sent to ${email}`,
          entityType: "user",
          metadata: { email },
        });
      },
    }),
  ],
  session: {
    cookieCache: {
      enabled: false,
      maxAge: 60,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await audit({
            action: "user.created",
            actorEmail: user.email,
            actorId: user.id,
            description: `User created: ${user.email}`,
            entityId: user.id,
            entityType: "user",
          });
        },
      },
    },
  },
});
