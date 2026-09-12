"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categories } from "@/db/schema/catalog";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { categoryInput } from "@/lib/catalog/validation";
import { db } from "@/lib/db";

async function isDescendant(targetId: string, potentialAncestorId: string): Promise<boolean> {
  let currentId: string | null = potentialAncestorId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const [parent] = await db
      .select({ parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, currentId))
      .limit(1);

    if (!parent || !parent.parentId) break;
    if (parent.parentId === targetId) return true;
    currentId = parent.parentId;
  }
  return false;
}

export interface CategoryFormState {
  success?: boolean;
  error?: string;
}

export async function upsertCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const admin = await requireAdmin();

  const raw = {
    id: String(formData.get("id") || "").trim() || undefined,
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim().toLowerCase(),
    description: String(formData.get("description") || "").trim(),
    parentId: String(formData.get("parentId") || "").trim() || null,
    status: (String(formData.get("status") || "draft") as "draft" | "published" | "archived"),
  };

  const parsed = categoryInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category data" };
  }

  const { id, name, slug, description, parentId, status } = parsed.data;

  // Prevent cycle
  if (id && parentId) {
    if (id === parentId) {
      return { error: "A category cannot be its own parent." };
    }
    const cyclic = await isDescendant(id, parentId);
    if (cyclic) {
      return { error: "Cannot set a descendant category as parent (cyclic hierarchy)." };
    }
  }

  try {
    if (id) {
      // Check slug collision
      const [existingSlug] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (existingSlug && existingSlug.id !== id) {
        return { error: `Category slug "${slug}" is already taken.` };
      }

      await db
        .update(categories)
        .set({
          name,
          slug,
          description,
          parentId,
          status,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id));

      await audit({
        action: "catalog.category_updated",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Updated category "${name}" (${slug})`,
        entityId: id,
        entityType: "category",
        metadata: { slug, parentId, status },
      });
    } else {
      // Check slug collision
      const [existingSlug] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (existingSlug) {
        return { error: `Category slug "${slug}" is already taken.` };
      }

      const [newCat] = await db
        .insert(categories)
        .values({
          name,
          slug,
          description,
          parentId,
          status,
        })
        .returning();

      await audit({
        action: "catalog.category_created",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Created category "${name}" (${slug})`,
        entityId: newCat.id,
        entityType: "category",
        metadata: { slug, parentId, status },
      });
    }

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save category";
    return { error: msg };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<CategoryFormState> {
  const admin = await requireAdmin();

  // Check children
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, categoryId))
    .limit(1);

  if (children.length > 0) {
    return { error: "Cannot delete a category that has subcategories. Reassign them first." };
  }

  try {
    await db.delete(categories).where(eq(categories.id, categoryId));

    await audit({
      action: "catalog.category_deleted",
      actorEmail: admin.user.email,
      actorId: admin.user.id,
      description: `Deleted category ${categoryId}`,
      entityId: categoryId,
      entityType: "category",
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete category";
    return { error: msg };
  }
}
