import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { blogPosts } from "@/db/schema/blog";
import { db } from "@/lib/db";

/**
 * A post is live when it is published and its publish time has arrived.
 * Published posts with a future `publishedAt` are "scheduled" and stay hidden
 * until then; ISR revalidation picks them up automatically.
 */
export const isLivePost = () =>
  and(
    eq(blogPosts.status, "published"),
    or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, sql`now()`))
  );

export async function getPublishedPosts() {
  return db
    .select()
    .from(blogPosts)
    .where(isLivePost())
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPublishedPostBySlug(slug: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), isLivePost()))
    .limit(1);
  return post ?? null;
}

export async function getAllPostsForAdmin() {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}
