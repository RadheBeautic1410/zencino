"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { collectionProducts, collections } from "@/db/schema/catalog";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { revalidateStorefront } from "@/lib/catalog/revalidate";
import { db } from "@/lib/db";

export interface CollectionFormState {
  error?: string;
  success?: boolean;
}

export async function upsertCollectionAction(
  _prevState: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") || "").trim() || undefined;
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "draft") as
    | "draft"
    | "published"
    | "archived";

  if (!name || name.length < 2) {
    return { error: "Collection name must be at least 2 characters long." };
  }

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: "Slug must contain only lowercase letters, numbers, and hyphens.",
    };
  }

  try {
    if (id) {
      const [existingSlug] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);

      if (existingSlug && existingSlug.id !== id) {
        return { error: `Collection slug "${slug}" is already in use.` };
      }

      await db
        .update(collections)
        .set({
          name,
          slug,
          description,
          status,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, id));

      await audit({
        action: "catalog.collection_updated",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Updated collection "${name}" (${slug})`,
        entityId: id,
        entityType: "collection",
      });
    } else {
      const [existingSlug] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);

      if (existingSlug) {
        return { error: `Collection slug "${slug}" is already in use.` };
      }

      const [newCol] = await db
        .insert(collections)
        .values({
          name,
          slug,
          description,
          status,
        })
        .returning();

      await audit({
        action: "catalog.collection_created",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Created collection "${name}" (${slug})`,
        entityId: newCol.id,
        entityType: "collection",
      });
    }

    revalidatePath("/admin/collections");
    revalidateStorefront();
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to save collection";
    return { error: msg };
  }
}

export async function addProductToCollectionAction(
  collectionId: string,
  productId: string
): Promise<CollectionFormState> {
  await requireAdmin();

  try {
    const existing = await db
      .select({ sortOrder: collectionProducts.sortOrder })
      .from(collectionProducts)
      .where(eq(collectionProducts.collectionId, collectionId));

    await db
      .insert(collectionProducts)
      .values({
        collectionId,
        productId,
        sortOrder: existing.length,
      })
      .onConflictDoNothing();

    revalidatePath("/admin/collections");
    revalidateStorefront();
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to add product to collection";
    return { error: msg };
  }
}

export async function removeProductFromCollectionAction(
  collectionId: string,
  productId: string
): Promise<CollectionFormState> {
  await requireAdmin();

  try {
    await db
      .delete(collectionProducts)
      .where(
        and(
          eq(collectionProducts.collectionId, collectionId),
          eq(collectionProducts.productId, productId)
        )
      );

    revalidatePath("/admin/collections");
    revalidateStorefront();
    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to remove product from collection";
    return { error: msg };
  }
}
