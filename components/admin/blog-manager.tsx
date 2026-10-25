"use client";

import { Article, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteBlogPostAction, upsertBlogPostAction } from "@/app/actions/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

interface Post {
  body: string;
  coverImageAlt: string;
  coverImageUrl: string;
  excerpt: string;
  id: string;
  publishedAt: string | null;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: "draft" | "published" | "archived";
  title: string;
}

const LABEL =
  "block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1";
const TEXTAREA =
  "w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function BlogManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [confirm, confirmDialog] = useConfirm();
  const [editing, setEditing] = useState<Post | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const open = (post: Post | null) => {
    setEditing(post);
    setIsCreating(!post);
    setCoverUrl(post?.coverImageUrl ?? "");
    setSlug(post?.slug ?? "");
    setSlugTouched(Boolean(post));
    setError(null);
    setSuccess(null);
  };

  const close = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) {
      return null;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Upload failed");
      }
      const key: string = json.asset.storageKey;
      return key.startsWith("http://") || key.startsWith("https://")
        ? key
        : `/uploads/${key}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (file: File | undefined) => {
    const url = await uploadImage(file);
    if (url) {
      setCoverUrl(url);
    }
  };

  /** Uploads an image and drops `![alt](url)` into the content at the cursor. */
  const handleInsertImage = async (file: File | undefined) => {
    const url = await uploadImage(file);
    const textarea = bodyRef.current;
    if (!(url && textarea)) {
      return;
    }
    const alt = (file?.name ?? "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const snippet = `![${alt}](${url})`;
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.slice(0, selectionStart).replace(/\n*$/, "");
    const after = value.slice(selectionEnd).replace(/^\n*/, "");
    textarea.value = `${before}${before ? "\n\n" : ""}${snippet}${after ? "\n\n" : ""}${after}`;
    textarea.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertBlogPostAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        close();
        setSuccess(editing ? "Post updated!" : "Post created!");
        router.refresh();
      }
    });
  };

  const handleDelete = async (post: Post) => {
    const confirmed = await confirm({
      title: "Delete post?",
      description: `Are you sure you want to delete "${post.title}"?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      const res = await deleteBlogPostAction(post.id);
      if (res.error) {
        setError(res.error);
      } else {
        if (editing?.id === post.id) {
          close();
        }
        router.refresh();
      }
    });
  };

  const showForm = isCreating || editing;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {confirmDialog}
      <div className={showForm ? "lg:col-span-2" : "lg:col-span-5"}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Posts ({posts.length})</CardTitle>
              <CardDescription>
                Published posts appear at /blog.
              </CardDescription>
            </div>
            <Button disabled={isCreating} onClick={() => open(null)} size="sm">
              <Plus className="mr-1.5" size={14} /> New Post
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {success && !showForm && (
              <div className="mx-4 mb-4 rounded border border-success/30 bg-success/10 p-3 text-success text-xs">
                {success}
              </div>
            )}
            {error && !showForm && (
              <div className="mx-4 mb-4 rounded border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
                {error}
              </div>
            )}
            {posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No blog posts yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div
                    className="flex items-center justify-between gap-3 p-4"
                    key={post.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Article
                        className="shrink-0 text-primary"
                        size={24}
                        weight="fill"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">
                            {post.title}
                          </span>
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <p className="truncate font-mono text-2xs text-muted-foreground">
                          /blog/{post.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        onClick={() => open(post)}
                        size="sm"
                        variant="ghost"
                      >
                        <PencilSimple size={14} />
                      </Button>
                      <Button
                        disabled={isPending}
                        onClick={() => handleDelete(post)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Edit Post" : "New Post"}</CardTitle>
              <CardDescription>
                Content: blank line = new paragraph, &quot;## &quot; = heading,
                &quot;- &quot; = bullet, ![alt](url) = image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                key={editing?.id ?? "new"}
                onSubmit={handleSubmit}
              >
                {editing && (
                  <input name="id" type="hidden" value={editing.id} />
                )}
                <input name="coverImageUrl" type="hidden" value={coverUrl} />

                {error && (
                  <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className={LABEL} htmlFor="blog-title">
                    Title *
                  </label>
                  <Input
                    defaultValue={editing?.title ?? ""}
                    id="blog-title"
                    name="title"
                    onChange={(e) => {
                      if (!slugTouched) {
                        setSlug(slugify(e.target.value));
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-slug">
                    Slug *
                  </label>
                  <Input
                    id="blog-slug"
                    name="slug"
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    required
                    value={slug}
                  />
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-cover">
                    Cover Image
                  </label>
                  {coverUrl && (
                    // biome-ignore lint/performance/noImgElement: admin preview of an arbitrary uploaded URL.
                    <img
                      alt="Cover preview"
                      className="mb-2 aspect-video w-full max-w-sm border border-border object-cover"
                      src={coverUrl}
                    />
                  )}
                  <input
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="block w-full text-xs"
                    id="blog-cover"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                    type="file"
                  />
                  {uploading && (
                    <p className="mt-1 text-muted-foreground text-xs">
                      Uploading...
                    </p>
                  )}
                  {coverUrl && (
                    <button
                      className="mt-1 text-destructive text-xs underline"
                      onClick={() => setCoverUrl("")}
                      type="button"
                    >
                      Remove cover
                    </button>
                  )}
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-cover-alt">
                    Cover Image Alt Text
                  </label>
                  <Input
                    defaultValue={editing?.coverImageAlt ?? ""}
                    id="blog-cover-alt"
                    name="coverImageAlt"
                  />
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-excerpt">
                    Excerpt
                  </label>
                  <textarea
                    className={TEXTAREA}
                    defaultValue={editing?.excerpt ?? ""}
                    id="blog-excerpt"
                    name="excerpt"
                    placeholder="Short summary shown on the blog list..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-body">
                    Content
                  </label>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <label
                      className="inline-flex cursor-pointer items-center border border-border px-2.5 py-1.5 font-semibold text-xs hover:bg-muted"
                      htmlFor="blog-body-image"
                    >
                      <Plus className="mr-1.5" size={12} /> Insert image at
                      cursor
                    </label>
                    <input
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="sr-only"
                      id="blog-body-image"
                      onChange={(e) => {
                        handleInsertImage(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                      type="file"
                    />
                    <span className="text-muted-foreground text-xs">
                      Place the cursor under a heading or paragraph first.
                    </span>
                  </div>
                  <textarea
                    className={`${TEXTAREA} font-mono`}
                    defaultValue={editing?.body ?? ""}
                    id="blog-body"
                    name="body"
                    ref={bodyRef}
                    rows={16}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL} htmlFor="blog-seo-title">
                      SEO Title
                    </label>
                    <Input
                      defaultValue={editing?.seoTitle ?? ""}
                      id="blog-seo-title"
                      name="seoTitle"
                    />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="blog-status">
                      Status
                    </label>
                    <select
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      defaultValue={editing?.status ?? "draft"}
                      id="blog-status"
                      name="status"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={LABEL} htmlFor="blog-seo-desc">
                    SEO Description
                  </label>
                  <textarea
                    className={TEXTAREA}
                    defaultValue={editing?.seoDescription ?? ""}
                    id="blog-seo-desc"
                    name="seoDescription"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    disabled={isPending || uploading}
                    type="submit"
                  >
                    {isPending
                      ? "Saving..."
                      : editing
                        ? "Update Post"
                        : "Create Post"}
                  </Button>
                  <Button onClick={close} type="button" variant="secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
