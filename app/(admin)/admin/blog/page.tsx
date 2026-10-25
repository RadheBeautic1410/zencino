import { BlogManager } from "@/components/admin/blog-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { getAllPostsForAdmin } from "@/lib/blog/queries";

export const metadata = {
  title: "Blog - Zencino Admin",
};

export default async function AdminBlogPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <OrbitPageHeader
        description="Write and publish blog posts for the storefront."
        eyebrow="Content"
        title="Blog"
      />
      <BlogManager
        posts={posts.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          body: p.body,
          coverImageUrl: p.coverImageUrl,
          coverImageAlt: p.coverImageAlt,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          status: p.status,
          publishedAt: p.publishedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
