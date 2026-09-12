import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: optionalString,
  APP_SECRET: z
    .string()
    .min(32)
    .refine((value) => !value.includes("replace-with")),
  CHECKOUT_ENABLED: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().optional()
  ),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_WEBHOOK_SECRET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
