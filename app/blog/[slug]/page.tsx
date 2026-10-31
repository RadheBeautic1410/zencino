import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreShell } from "@/components/store/store-shell";
import { getPublishedPostBySlug } from "@/lib/blog/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug).catch(() => null);
  if (!post) {
    return { title: "Post Not Found" };
  }
  return {
    // The root layout's title template appends " | Zencino"; drop a brand
    // suffix already present in the SEO title so it is not repeated.
    title: (post.seoTitle || post.title).replace(/\s*[|–-]\s*Zencino\s*$/i, ""),
    alternates: { canonical: `/blog/${slug}` },
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: post.coverImageUrl
      ? { images: [post.coverImageUrl] }
      : undefined,
  };
}

type Block =
  | { type: "h"; text: string }
  | { type: "img"; alt: string; src: string }
  | { type: "ul"; items: string[] }
  | { type: "p"; text: string };

const IMAGE_LINE = /^!\[([^\]]*)\]\(((?:\/|https?:\/\/)[^\s)]+)\)$/;

function parseBody(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith("## ")) {
        return { type: "h", text: chunk.slice(3).trim() };
      }
      const image = IMAGE_LINE.exec(chunk);
      if (image) {
        return { type: "img", alt: image[1], src: image[2] };
      }
      const lines = chunk.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return { type: "ul", items: lines.map((l) => l.trim().slice(2)) };
      }
      return { type: "p", text: chunk };
    });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const blocks = parseBody(post.body);

  return (
    <StoreShell>
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-14">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs"
        >
          <Link className="hover:text-foreground" href="/">
            Home
          </Link>
          <span>/</span>
          <Link className="hover:text-foreground" href="/blog">
            Blog
          </Link>
        </nav>

        <h1 className="break-words font-heading font-extrabold text-3xl leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="mt-3 text-muted-foreground text-xs">
            {post.publishedAt.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {post.coverImageUrl && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-border/80">
            <Image
              alt={post.coverImageAlt || post.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              src={post.coverImageUrl}
            />
          </div>
        )}

        <div className="mt-8 space-y-5 text-base text-foreground/90 leading-relaxed">
          {blocks.map((block, i) => {
            const key = `${block.type}-${i}`;
            if (block.type === "h") {
              return (
                <h2 className="pt-2 font-heading font-bold text-2xl" key={key}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === "img") {
              return (
                <figure className="my-2" key={key}>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80">
                    <Image
                      alt={block.alt}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      src={block.src}
                    />
                  </div>
                  {block.alt && (
                    <figcaption className="mt-2 text-center text-muted-foreground text-xs">
                      {block.alt}
                    </figcaption>
                  )}
                </figure>
              );
            }
            if (block.type === "ul") {
              return (
                <ul className="list-disc space-y-1.5 pl-6" key={key}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p className="whitespace-pre-line break-words" key={key}>
                {block.text}
              </p>
            );
          })}
        </div>
      </article>
    </StoreShell>
  );
}
