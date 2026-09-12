"use client";

import { useState, useTransition } from "react";
import { FolderSimple, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { deleteCategoryAction, upsertCategoryAction } from "@/app/actions/catalog-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parentOptions = categories.filter((c) => !editingCategory || c.id !== editingCategory.id);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertCategoryAction({}, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(editingCategory ? "Category updated!" : "Category created!");
        setEditingCategory(null);
        setIsCreating(false);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await deleteCategoryAction(id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Category deleted successfully.");
      }
    });
  };

  // Group top-level and subcategories
  const topLevel = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parentId) {
      const list = childrenMap.get(c.parentId) || [];
      list.push(c);
      childrenMap.set(c.parentId, list);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Category Tree / List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Categories ({categories.length})</CardTitle>
              <CardDescription>
                Taxonomy and hierarchical categories for Zencino products.
              </CardDescription>
            </div>
            <Button
              disabled={isCreating}
              onClick={() => {
                setEditingCategory(null);
                setIsCreating(true);
                setError(null);
              }}
              size="sm"
            >
              <Plus className="mr-1.5" size={14} /> Add Category
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No categories created yet. Click &quot;Add Category&quot; to create your first category.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topLevel.map((cat) => {
                  const children = childrenMap.get(cat.id) || [];
                  return (
                    <div key={cat.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FolderSimple className="text-primary" size={20} weight="fill" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{cat.name}</span>
                              <Badge
                                variant={cat.status === "published" ? "default" : "secondary"}
                                className={cat.status === "published" ? "text-success" : ""}
                              >
                                {cat.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">/{cat.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsCreating(false);
                              setEditingCategory(cat);
                              setError(null);
                            }}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(cat.id, cat.name)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {children.length > 0 && (
                        <div className="mt-3 ml-6 space-y-2 border-l-2 border-border pl-4">
                          {children.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between gap-2 py-1">
                              <div>
                                <span className="font-medium text-xs">{sub.name}</span>
                                <span className="ml-2 font-mono text-2xs text-muted-foreground">/{sub.slug}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setIsCreating(false);
                                    setEditingCategory(sub);
                                    setError(null);
                                  }}
                                >
                                  <PencilSimple size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(sub.id, sub.name)}
                                >
                                  <Trash size={12} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Form */}
      <div>
        {(isCreating || editingCategory) ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingCategory ? "Edit Category" : "New Category"}</CardTitle>
              <CardDescription>
                {editingCategory ? `Editing "${editingCategory.name}"` : "Create a new product category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}

                {error && (
                  <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded border border-success/30 bg-success/10 p-3 text-xs text-success">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Name *
                  </label>
                  <Input
                    name="name"
                    required
                    defaultValue={editingCategory?.name ?? ""}
                    placeholder="e.g. Home & Kitchen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Slug *
                  </label>
                  <Input
                    name="slug"
                    required
                    defaultValue={editingCategory?.slug ?? ""}
                    placeholder="e.g. home-kitchen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Parent Category
                  </label>
                  <select
                    name="parentId"
                    defaultValue={editingCategory?.parentId ?? ""}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">None (Top-level Category)</option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingCategory?.description ?? ""}
                    placeholder="Brief description for category browsing..."
                    className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingCategory?.status ?? "draft"}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCreating(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
            Select a category to edit or click &quot;Add Category&quot; above.
          </div>
        )}
      </div>
    </div>
  );
}
