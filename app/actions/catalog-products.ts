"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  productCategories,
  productMedia,
  products,
  productVariants,
  slugRedirects,
  variantChannels,
} from "@/db/schema/catalog";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import {
  isAmazonProductUrl,
  optionSignature,
  variantInput,
} from "@/lib/catalog/validation";
import { db } from "@/lib/db";

export interface ActionResult {
  error?: string;
  id?: string;
  success?: boolean;
}

export async function upsertProductAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") || "").trim() || undefined;
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  const description = String(formData.get("description") || "").trim();
  const primaryCategoryId =
    String(formData.get("primaryCategoryId") || "").trim() || null;
  const care = String(formData.get("care") || "").trim();
  const packageContents = String(formData.get("packageContents") || "").trim();
  const seoTitle = String(formData.get("seoTitle") || "").trim();
  const seoDescription = String(formData.get("seoDescription") || "").trim();

  let specifications: Record<string, string> = {};
  const specsRaw = String(formData.get("specifications") || "").trim();
  if (specsRaw) {
    try {
      specifications = JSON.parse(specsRaw);
    } catch {
      return { error: "Specifications must be valid JSON" };
    }
  }

  if (!name || name.length < 2) {
    return { error: "Product name must be at least 2 characters long." };
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: "Slug must contain only lowercase letters, numbers, and hyphens.",
    };
  }

  try {
    if (id) {
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!existing) {
        return { error: "Product not found" };
      }

      // Check slug collision
      const [slugTaken] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (slugTaken && slugTaken.id !== id) {
        return { error: `Product slug "${slug}" is already in use.` };
      }

      // Record slug redirect if changed
      if (existing.slug !== slug) {
        await db
          .insert(slugRedirects)
          .values({
            oldPath: `/products/${existing.slug}`,
            newPath: `/products/${slug}`,
          })
          .onConflictDoUpdate({
            target: slugRedirects.oldPath,
            set: { newPath: `/products/${slug}`, updatedAt: new Date() },
          });
      }

      await db
        .update(products)
        .set({
          name,
          slug,
          description,
          primaryCategoryId,
          specifications,
          care,
          packageContents,
          seoTitle,
          seoDescription,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));

      if (primaryCategoryId) {
        await db
          .insert(productCategories)
          .values({ productId: id, categoryId: primaryCategoryId })
          .onConflictDoNothing();
      }

      await audit({
        action: "catalog.product_updated",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Updated product "${name}" (${slug})`,
        entityId: id,
        entityType: "product",
      });

      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      return { success: true, id };
    }
    // Create new product
    const [slugTaken] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (slugTaken) {
      return { error: `Product slug "${slug}" is already in use.` };
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        slug,
        description,
        primaryCategoryId,
        specifications,
        care,
        packageContents,
        seoTitle,
        seoDescription,
        status: "draft",
      })
      .returning();

    // Automatically create a default base variant
    const baseSku = `${slug
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10)}-DEFAULT`;
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId: newProduct.id,
        sku: baseSku,
        title: "Standard",
        options: {},
        optionSignature: "[]",
        currency: "INR",
        active: true,
      })
      .returning();

    // Create default channels for variant
    await db.insert(variantChannels).values([
      { variantId: variant.id, channel: "website", enabled: false },
      { variantId: variant.id, channel: "amazon", enabled: false },
    ]);

    if (primaryCategoryId) {
      await db
        .insert(productCategories)
        .values({ productId: newProduct.id, categoryId: primaryCategoryId })
        .onConflictDoNothing();
    }

    await audit({
      action: "catalog.product_created",
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Created product "${name}" (${slug})`,
      entityId: newProduct.id,
      entityType: "product",
    });

    revalidatePath("/admin/products");
    return { success: true, id: newProduct.id };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to save product";
    return { error: msg };
  }
}

export async function upsertVariantAction(
  productId: string,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") || "").trim() || undefined;
  const sku = String(formData.get("sku") || "")
    .trim()
    .toUpperCase();
  const title = String(formData.get("title") || "").trim();
  const priceInput = formData.get("priceINR");
  const mrpInput = formData.get("mrpINR");
  const weightInput = formData.get("weightG");
  const lengthInput = formData.get("lengthMm");
  const widthInput = formData.get("widthMm");
  const heightInput = formData.get("heightMm");
  const active =
    formData.get("active") === "true" || formData.get("active") === "on";
  const websiteEnabled =
    formData.get("websiteEnabled") === "true" ||
    formData.get("websiteEnabled") === "on";
  const amazonEnabled =
    formData.get("amazonEnabled") === "true" ||
    formData.get("amazonEnabled") === "on";
  const amazonUrl = String(formData.get("amazonUrl") || "").trim();

  let options: Record<string, string> = {};
  const optionsRaw = String(formData.get("options") || "").trim();
  if (optionsRaw) {
    try {
      options = JSON.parse(optionsRaw);
    } catch {
      return { error: "Options must be valid JSON" };
    }
  }

  // Convert rupees to minor units (paise)
  const priceMinor =
    priceInput && !Number.isNaN(Number(priceInput))
      ? Math.round(Number(priceInput) * 100)
      : null;
  const mrpMinor =
    mrpInput && !Number.isNaN(Number(mrpInput))
      ? Math.round(Number(mrpInput) * 100)
      : null;
  const weightG =
    weightInput && !Number.isNaN(Number(weightInput))
      ? Number(weightInput)
      : null;
  const lengthMm =
    lengthInput && !Number.isNaN(Number(lengthInput))
      ? Number(lengthInput)
      : null;
  const widthMm =
    widthInput && !Number.isNaN(Number(widthInput)) ? Number(widthInput) : null;
  const heightMm =
    heightInput && !Number.isNaN(Number(heightInput))
      ? Number(heightInput)
      : null;

  const validation = variantInput.safeParse({
    id,
    sku,
    title,
    options,
    priceMinor,
    mrpMinor,
    weightG,
    lengthMm,
    widthMm,
    heightMm,
    active,
    websiteEnabled,
    amazonEnabled,
    amazonUrl,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message ?? "Invalid variant values",
    };
  }

  const sig = optionSignature(options);

  try {
    // Extract ASIN from Amazon URL if present in standard path
    let asin: string | null = null;
    if (amazonUrl && isAmazonProductUrl(amazonUrl)) {
      const match = amazonUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (match) {
        asin = match[1].toUpperCase();
      }
    }

    const isVerifiedAmazon = Boolean(
      amazonEnabled && amazonUrl && isAmazonProductUrl(amazonUrl)
    );

    if (id) {
      // Check SKU uniqueness
      const [skuTaken] = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.sku, sku))
        .limit(1);

      if (skuTaken && skuTaken.id !== id) {
        return {
          error: `SKU "${sku}" is already assigned to another variant.`,
        };
      }

      await db
        .update(productVariants)
        .set({
          sku,
          title,
          options,
          optionSignature: sig,
          priceMinor,
          mrpMinor,
          weightG,
          lengthMm,
          widthMm,
          heightMm,
          active,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, id));

      // Update channels
      await db
        .insert(variantChannels)
        .values({
          variantId: id,
          channel: "website",
          enabled: websiteEnabled,
        })
        .onConflictDoUpdate({
          target: [variantChannels.variantId, variantChannels.channel],
          set: { enabled: websiteEnabled, updatedAt: new Date() },
        });

      await db
        .insert(variantChannels)
        .values({
          variantId: id,
          channel: "amazon",
          enabled: amazonEnabled,
          externalUrl: amazonUrl || null,
          asin,
          verifiedAt: isVerifiedAmazon ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [variantChannels.variantId, variantChannels.channel],
          set: {
            enabled: amazonEnabled,
            externalUrl: amazonUrl || null,
            asin,
            verifiedAt: isVerifiedAmazon ? new Date() : null,
            updatedAt: new Date(),
          },
        });

      await audit({
        action: "catalog.variant_updated",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Updated variant ${sku} for product ${productId}`,
        entityId: id,
        entityType: "variant",
      });
    } else {
      // New variant
      const [skuTaken] = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.sku, sku))
        .limit(1);

      if (skuTaken) {
        return { error: `SKU "${sku}" is already in use.` };
      }

      const [newVar] = await db
        .insert(productVariants)
        .values({
          productId,
          sku,
          title,
          options,
          optionSignature: sig,
          priceMinor,
          mrpMinor,
          weightG,
          lengthMm,
          widthMm,
          heightMm,
          active,
        })
        .returning();

      await db.insert(variantChannels).values([
        { variantId: newVar.id, channel: "website", enabled: websiteEnabled },
        {
          variantId: newVar.id,
          channel: "amazon",
          enabled: amazonEnabled,
          externalUrl: amazonUrl || null,
          asin,
          verifiedAt: isVerifiedAmazon ? new Date() : null,
        },
      ]);

      await audit({
        action: "catalog.variant_created",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Created variant ${sku} for product ${productId}`,
        entityId: newVar.id,
        entityType: "variant",
      });
    }

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to save variant";
    return { error: msg };
  }
}

export async function deleteVariantAction(
  productId: string,
  variantId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();

  // Ensure product has at least one variant remaining
  const existing = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  if (existing.length <= 1) {
    return { error: "A product must have at least one variant." };
  }

  try {
    await db
      .delete(variantChannels)
      .where(eq(variantChannels.variantId, variantId));
    await db.delete(productVariants).where(eq(productVariants.id, variantId));

    await audit({
      action: "catalog.variant_deleted",
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Deleted variant ${variantId} from product ${productId}`,
      entityId: variantId,
      entityType: "variant",
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete variant";
    return { error: msg };
  }
}

export async function updateProductStatusAction(
  productId: string,
  newStatus: "draft" | "published" | "archived"
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) {
    return { error: "Product not found" };
  }

  if (newStatus === "published") {
    // Publish validation
    if (!product.primaryCategoryId) {
      return { error: "A primary category is required to publish a product." };
    }

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    if (variants.length === 0) {
      return { error: "Cannot publish a product without variants." };
    }

    const variantIds = variants.map((v) => v.id);
    const channels = await db
      .select()
      .from(variantChannels)
      .where(inArray(variantChannels.variantId, variantIds));

    for (const v of variants) {
      const vChannels = channels.filter((c) => c.variantId === v.id);
      const web = vChannels.find((c) => c.channel === "website");
      const amz = vChannels.find((c) => c.channel === "amazon");

      if (web?.enabled) {
        if (!v.priceMinor || v.priceMinor <= 0) {
          return {
            error: `Variant ${v.sku} has website sales enabled but has no valid selling price.`,
          };
        }
        if (!v.weightG || v.weightG <= 0) {
          return {
            error: `Variant ${v.sku} has website sales enabled but has no shipping weight (weight_g).`,
          };
        }
      }

      if (
        amz?.enabled &&
        (!amz.externalUrl || !isAmazonProductUrl(amz.externalUrl))
      ) {
        return {
          error: `Variant ${v.sku} has Amazon sales enabled but lacks a valid Amazon product URL.`,
        };
      }
    }
  }

  try {
    await db
      .update(products)
      .set({
        status: newStatus,
        publishedAt:
          newStatus === "published"
            ? product.publishedAt || new Date()
            : product.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    await audit({
      action: `catalog.product_status_${newStatus}`,
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Changed product "${product.name}" status to ${newStatus}`,
      entityId: productId,
      entityType: "product",
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to update product status";
    return { error: msg };
  }
}

export async function attachProductMediaAction(
  productId: string,
  assetId: string,
  variantId?: string
): Promise<ActionResult> {
  const admin = await requireAdmin();

  try {
    const existingMedia = await db
      .select({ sortOrder: productMedia.sortOrder })
      .from(productMedia)
      .where(eq(productMedia.productId, productId));

    const nextOrder = existingMedia.length;

    await db.insert(productMedia).values({
      productId,
      assetId,
      variantId: variantId || null,
      sortOrder: nextOrder,
    });

    await audit({
      action: "catalog.media_attached",
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Attached media asset ${assetId} to product ${productId}`,
      entityId: productId,
      entityType: "product_media",
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to attach media";
    return { error: msg };
  }
}

export async function detachProductMediaAction(
  productMediaId: string,
  productId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();

  try {
    await db.delete(productMedia).where(eq(productMedia.id, productMediaId));

    await audit({
      action: "catalog.media_detached",
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Detached media ${productMediaId} from product ${productId}`,
      entityId: productId,
      entityType: "product_media",
    });

    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to detach media";
    return { error: msg };
  }
}
