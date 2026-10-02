import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens"
  );
const attributes = z.record(
  z.string().trim().min(1).max(80),
  z.string().trim().min(1).max(500)
);
const positiveInteger = z
  .number()
  .int()
  .positive()
  .max(2_000_000_000)
  .nullable();
const money = z.number().int().nonnegative().max(2_000_000_000).nullable();
const positiveMillimetre = z
  .number()
  .positive()
  .max(1_000_000)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    "Dimensions allow at most 2 decimal places"
  )
  .nullable();

export function isAmazonProductUrl(value: string) {
  try {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    const url = new URL(trimmed);

    // Only HTTPS
    if (url.protocol !== "https:") {
      return false;
    }

    // Disallow credentials or custom ports for safety
    if (url.username || url.password || url.port) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // 1. Amazon short links (e.g. https://amzn.in/d/0beM940h, https://amzn.in/0beM940h, https://amzn.to/...)
    if (
      ["amzn.in", "www.amzn.in", "amzn.to", "www.amzn.to"].includes(hostname)
    ) {
      return (
        url.pathname.length > 1 && /^\/[a-zA-Z0-9_\-/]+$/.test(url.pathname)
      );
    }

    // 2. Full Amazon India domain (amazon.in, www.amazon.in)
    if (["amazon.in", "www.amazon.in"].includes(hostname)) {
      return (
        /\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:[/?#]|$)/i.test(url.pathname) ||
        /\/[^/]+\/dp\/[A-Z0-9]{10}(?:[/?#]|$)/i.test(url.pathname)
      );
    }

    return false;
  } catch {
    return false;
  }
}

export const variantInput = z
  .object({
    id: z.string().optional(),
    sku: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    options: attributes.default({}),
    priceMinor: money,
    mrpMinor: money,
    weightG: positiveInteger,
    lengthMm: positiveMillimetre,
    widthMm: positiveMillimetre,
    heightMm: positiveMillimetre,
    active: z.boolean(),
    websiteEnabled: z.boolean(),
    amazonEnabled: z.boolean(),
    amazonUrl: z.string().trim().max(2000).default(""),
  })
  .superRefine((value, ctx) => {
    if (
      value.websiteEnabled &&
      (value.priceMinor === null ||
        value.priceMinor <= 0 ||
        value.weightG === null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Website variants need a positive price and shipping weight",
        path: ["priceMinor"],
      });
    }
    if (
      value.mrpMinor !== null &&
      value.priceMinor !== null &&
      value.mrpMinor < value.priceMinor
    ) {
      ctx.addIssue({
        code: "custom",
        message: "MRP cannot be below selling price",
        path: ["mrpMinor"],
      });
    }
    if (value.amazonEnabled && !isAmazonProductUrl(value.amazonUrl)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Enter a valid Amazon India product URL (e.g. https://www.amazon.in/dp/ASIN or https://amzn.in/d/...)",
        path: ["amazonUrl"],
      });
    }
  });
export function optionSignature(options: Record<string, string>) {
  return JSON.stringify(
    Object.entries(options).sort(([a], [b]) => a.localeCompare(b))
  );
}
export const productInput = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(200),
    slug,
    description: z.string().trim().max(20_000),
    primaryCategoryId: z.string().min(1),
    specifications: attributes.default({}),
    care: z.string().trim().max(4000),
    packageContents: z.string().trim().max(4000),
    seoTitle: z.string().trim().max(120),
    seoDescription: z.string().trim().max(320),
    variants: z.array(variantInput).min(1).max(50),
  })
  .superRefine((value, ctx) => {
    const skus = value.variants.map((v) => v.sku.toLowerCase());
    const signatures = value.variants.map((v) => optionSignature(v.options));
    if (
      new Set(skus).size !== skus.length ||
      new Set(signatures).size !== signatures.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Each variant needs a unique SKU and option combination",
        path: ["variants"],
      });
    }
  });
export const categoryInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(4000),
  parentId: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
});
export type ProductInput = z.infer<typeof productInput>;
