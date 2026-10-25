import { and, desc, eq } from "drizzle-orm";
import { blogPosts } from "@/db/schema/blog";
import { db } from "@/lib/db";

export async function getPublishedPosts() {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPublishedPostBySlug(slug: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return post ?? null;
}

export async function getAllPostsForAdmin() {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}
