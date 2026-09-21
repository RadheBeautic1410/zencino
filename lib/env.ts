import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DATABASE_URL_UNPOOLED: optionalString,
    STORAGE_LOCATION: z.enum(["local", "firebase"]).default("local"),
    FIREBASE_STORAGE_BUCKET: optionalString,
    FIREBASE_PROJECT_ID: optionalString,
    FIREBASE_CLIENT_EMAIL: optionalString,
    FIREBASE_PRIVATE_KEY: optionalString,
    APP_SECRET: z
      .string()
      .min(32)
      .refine((value) => !value.includes("replace-with")),
    CHECKOUT_ENABLED: z.enum(["true", "false"]).default("false"),
    PAYMENT_MODE: z.enum(["upi_qr", "razorpay"]).default("upi_qr"),
    UPI_ID: z.string().min(1).default("zencino@upi"),
    UPI_NAME: z.string().min(1).default("Zencino"),
    RAZORPAY_KEY_ID: optionalString,
    RAZORPAY_KEY_SECRET: optionalString,
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
  })
  .superRefine((values, ctx) => {
    if (values.STORAGE_LOCATION !== "firebase") {
      return;
    }
    if (
      !values.FIREBASE_STORAGE_BUCKET ||
      /[:/]/.test(values.FIREBASE_STORAGE_BUCKET)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["FIREBASE_STORAGE_BUCKET"],
        message: "Firebase requires a bucket name without gs:// or a URL",
      });
    }
    if (
      (values.FIREBASE_CLIENT_EMAIL || values.FIREBASE_PRIVATE_KEY) &&
      !(
        values.FIREBASE_PROJECT_ID &&
        values.FIREBASE_CLIENT_EMAIL &&
        values.FIREBASE_PRIVATE_KEY
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["FIREBASE_CLIENT_EMAIL"],
        message:
          "Provide all three Firebase service account fields, or use Application Default Credentials",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
