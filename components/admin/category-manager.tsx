"use client";

import { FolderSimple, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import {
  deleteCategoryAction,
  upsertCategoryAction,
} from "@/app/actions/catalog-categories";
import { FilterControls } from "@/components/admin/admin-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Category {
  description: string;
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
  sortOrder: number;
  status: "draft" | "published" | "archived";
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const parentOptions = categories.filter(
    (c) => !editingCategory || c.id !== editingCategory.id
  );

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
    // biome-ignore lint/suspicious/noAlert: native confirmation kept until a shared dialog component exists.
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }
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

  const hasFilters = Boolean(searchTerm.trim() || statusFilter);

  // Group top-level and subcategories. While filtering, a parent stays visible
  // when any of its subcategories match so the hierarchy remains readable.
  const { topLevel, childrenMap } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matches = (c: Category) =>
      (!term ||
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)) &&
      (!statusFilter || c.status === statusFilter);

    const children = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentId && matches(c)) {
        const list = children.get(c.parentId) || [];
        list.push(c);
        children.set(c.parentId, list);
      }
    }
    return {
      topLevel: categories.filter(
        (c) => !c.parentId && (matches(c) || children.has(c.id))
      ),
      childrenMap: children,
    };
  }, [categories, searchTerm, statusFilter]);

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
          <div className="border-border border-b px-4 pb-4">
            <FilterControls
              onClear={
                hasFilters
                  ? () => {
                      setSearchTerm("");
                      setStatusFilter("");
                    }
                  : undefined
              }
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search name or slug..."
              searchValue={searchTerm}
              selects={[
                {
                  label: "Status",
                  param: "status",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { label: "Published", value: "published" },
                    { label: "Draft", value: "draft" },
                    { label: "Archived", value: "archived" },
                  ],
                },
              ]}
            />
          </div>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No categories created yet. Click &quot;Add Category&quot; to
                create your first category.
              </div>
            ) : topLevel.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No categories match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topLevel.map((cat) => {
                  const children = childrenMap.get(cat.id) || [];
                  return (
                    <div className="p-4" key={cat.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FolderSimple
                            className="text-primary"
                            size={20}
                            weight="fill"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {cat.name}
                              </span>
                              <Badge
                                className={
                                  cat.status === "published"
                                    ? "text-success"
                                    : ""
                                }
                                variant={
                                  cat.status === "published"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {cat.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              /{cat.slug}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => {
                              setIsCreating(false);
                              setEditingCategory(cat);
                              setError(null);
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {children.length > 0 && (
                        <div className="mt-3 ml-6 space-y-2 border-l-2 border-border pl-4">
                          {children.map((sub) => (
                            <div
                              className="flex items-center justify-between gap-2 py-1"
                              key={sub.id}
                            >
                              <div>
                                <span className="font-medium text-xs">
                                  {sub.name}
                                </span>
                                <span className="ml-2 font-mono text-2xs text-muted-foreground">
                                  /{sub.slug}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    setIsCreating(false);
                                    setEditingCategory(sub);
                                    setError(null);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <PencilSimple size={12} />
                                </Button>
                                <Button
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(sub.id, sub.name)}
                                  size="sm"
                                  variant="ghost"
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
        {isCreating || editingCategory ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingCategory ? "Edit Category" : "New Category"}
              </CardTitle>
              <CardDescription>
                {editingCategory
                  ? `Editing "${editingCategory.name}"`
                  : "Create a new product category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {editingCategory && (
                  <input name="id" type="hidden" value={editingCategory.id} />
                )}

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
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="category-manager-name"
                  >
                    Name *
                  </label>
                  <Input
                    defaultValue={editingCategory?.name ?? ""}
                    id="category-manager-name"
                    name="name"
                    placeholder="e.g. Home & Kitchen"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="category-manager-slug"
                  >
                    Slug *
                  </label>
                  <Input
                    defaultValue={editingCategory?.slug ?? ""}
                    id="category-manager-slug"
                    name="slug"
                    placeholder="e.g. home-kitchen"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="category-manager-parent-category"
                  >
                    Parent Category
                  </label>
                  <select
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    defaultValue={editingCategory?.parentId ?? ""}
                    id="category-manager-parent-category"
                    name="parentId"
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
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="category-manager-description"
                  >
                    Description
                  </label>
                  <textarea
                    className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    defaultValue={editingCategory?.description ?? ""}
                    id="category-manager-description"
                    name="description"
                    placeholder="Brief description for category browsing..."
                    rows={3}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="category-manager-status"
                  >
                    Status
                  </label>
                  <select
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    defaultValue={editingCategory?.status ?? "draft"}
                    id="category-manager-status"
                    name="status"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" disabled={isPending} type="submit">
                    {isPending
                      ? "Saving..."
                      : editingCategory
                        ? "Update Category"
                        : "Create Category"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCreating(false);
                      setError(null);
                    }}
                    type="button"
                    variant="secondary"
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
