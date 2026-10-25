"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { blogPosts } from "@/db/schema/blog";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export interface BlogFormState {
  error?: string;
  success?: boolean;
}

function revalidateBlog(slug?: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function upsertBlogPostAction(
  formData: FormData
): Promise<BlogFormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") || "").trim() || undefined;
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  const status = String(formData.get("status") || "draft") as
    | "draft"
    | "published"
    | "archived";

  if (title.length < 3) {
    return { error: "Title must be at least 3 characters long." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: "Slug must contain only lowercase letters, numbers, and hyphens.",
    };
  }
  if (!["draft", "published", "archived"].includes(status)) {
    return { error: "Invalid status." };
  }

  const values = {
    title,
    slug,
    status,
    excerpt: String(formData.get("excerpt") || "").trim(),
    body: String(formData.get("body") || "").trim(),
    coverImageUrl: String(formData.get("coverImageUrl") || "").trim(),
    coverImageAlt: String(formData.get("coverImageAlt") || "").trim(),
    seoTitle: String(formData.get("seoTitle") || "").trim(),
    seoDescription: String(formData.get("seoDescription") || "").trim(),
  };

  try {
    const [clash] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);
    if (clash && clash.id !== id) {
      return { error: `Slug "${slug}" is already in use.` };
    }

    if (id) {
      const [existing] = await db
        .select({ publishedAt: blogPosts.publishedAt, slug: blogPosts.slug })
        .from(blogPosts)
        .where(eq(blogPosts.id, id))
        .limit(1);
      if (!existing) {
        return { error: "Post not found." };
      }
      await db
        .update(blogPosts)
        .set({
          ...values,
          publishedAt:
            status === "published"
              ? (existing.publishedAt ?? new Date())
              : existing.publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, id));
      await audit({
        action: "blog.post_updated",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Updated blog post "${title}" (${slug})`,
        entityId: id,
        entityType: "blog_post",
      });
      revalidateBlog(existing.slug);
    } else {
      const [created] = await db
        .insert(blogPosts)
        .values({
          ...values,
          authorId: admin.user.id,
          publishedAt: status === "published" ? new Date() : null,
        })
        .returning({ id: blogPosts.id });
      await audit({
        action: "blog.post_created",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Created blog post "${title}" (${slug})`,
        entityId: created.id,
        entityType: "blog_post",
      });
    }

    revalidateBlog(slug);
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to save post",
    };
  }
}

export async function deleteBlogPostAction(id: string): Promise<BlogFormState> {
  const admin = await requireAdmin();
  try {
    const [deleted] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning({ slug: blogPosts.slug, title: blogPosts.title });
    if (deleted) {
      await audit({
        action: "blog.post_deleted",
        actorEmail: admin.user.email,
        actorId: admin.user.id,
        description: `Deleted blog post "${deleted.title}" (${deleted.slug})`,
        entityId: id,
        entityType: "blog_post",
      });
      revalidateBlog(deleted.slug);
    }
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}
