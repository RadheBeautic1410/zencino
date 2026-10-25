import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoreShell } from "@/components/store/store-shell";
import { getPublishedPosts } from "@/lib/blog/queries";

export const metadata: Metadata = {
  title: "Blog - Zencino",
  description:
    "Ideas, guides and stories from Zencino: acrylic home, kitchen and office essentials.",
};

export const revalidate = 300;

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts().catch(() => []);

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
        <h1 className="font-heading font-extrabold text-3xl tracking-tight md:text-4xl">
          Blog
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Ideas, guides and stories from Zencino.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-muted-foreground text-sm">
            No posts yet. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md"
                href={`/blog/${post.slug}`}
                key={post.id}
              >
                <div className="relative aspect-video w-full bg-muted">
                  {post.coverImageUrl && (
                    <Image
                      alt={post.coverImageAlt || post.title}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={post.coverImageUrl}
                    />
                  )}
                </div>
                <div className="space-y-2 p-5">
                  {post.publishedAt && (
                    <p className="text-2xs text-muted-foreground uppercase tracking-ui">
                      {post.publishedAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <h2 className="font-bold text-lg leading-snug group-hover:text-primary">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="line-clamp-3 text-muted-foreground text-sm">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
