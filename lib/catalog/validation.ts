import { z } from "zod";

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");
const attributes = z.record(z.string().trim().min(1).max(80), z.string().trim().min(1).max(500));
const positiveInteger = z.number().int().positive().max(2_000_000_000).nullable();
const money = z.number().int().nonnegative().max(2_000_000_000).nullable();

export function isAmazonProductUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["amazon.in", "www.amazon.in"].includes(url.hostname) && !url.username && !url.password && !url.port && /\/(dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
}

export const variantInput = z.object({
  id: z.string().optional(), sku: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(120),
  options: attributes.default({}), priceMinor: money, mrpMinor: money,
  weightG: positiveInteger, lengthMm: positiveInteger, widthMm: positiveInteger, heightMm: positiveInteger,
  active: z.boolean(), websiteEnabled: z.boolean(), amazonEnabled: z.boolean(),
  amazonUrl: z.string().trim().max(2000).default(""),
}).superRefine((value, ctx) => {
  if (value.websiteEnabled && (value.priceMinor === null || value.priceMinor <= 0 || value.weightG === null)) ctx.addIssue({code: "custom", message: "Website variants need a positive price and shipping weight", path: ["priceMinor"]});
  if (value.mrpMinor !== null && value.priceMinor !== null && value.mrpMinor < value.priceMinor) ctx.addIssue({code: "custom", message: "MRP cannot be below selling price", path: ["mrpMinor"]});
  if (value.amazonEnabled && !isAmazonProductUrl(value.amazonUrl)) ctx.addIssue({code: "custom", message: "Use the full https://www.amazon.in/dp/ASIN product URL", path: ["amazonUrl"]});
});
export function optionSignature(options: Record<string,string>) {
  return JSON.stringify(Object.entries(options).sort(([a],[b]) => a.localeCompare(b)));
}
export const productInput = z.object({
  id: z.string().optional(), name: z.string().trim().min(2).max(200), slug,
  description: z.string().trim().max(20_000), primaryCategoryId: z.string().min(1),
  specifications: attributes.default({}), care: z.string().trim().max(4000), packageContents: z.string().trim().max(4000),
  seoTitle: z.string().trim().max(120), seoDescription: z.string().trim().max(320),
  variants: z.array(variantInput).min(1).max(50),
}).superRefine((value, ctx) => {
  const skus = value.variants.map(v => v.sku.toLowerCase());
  const signatures = value.variants.map(v => optionSignature(v.options));
  if (new Set(skus).size !== skus.length || new Set(signatures).size !== signatures.length) ctx.addIssue({ code: "custom", message: "Each variant needs a unique SKU and option combination", path: ["variants"] });
});
export const categoryInput = z.object({id: z.string().optional(), name: z.string().trim().min(2).max(120), slug, description: z.string().trim().max(4000), parentId: z.string().nullable(), status: z.enum(["draft", "published", "archived"])});
export type ProductInput = z.infer<typeof productInput>;
