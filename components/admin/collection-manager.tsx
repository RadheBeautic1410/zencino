"use client";

import { PencilSimple, Plus, SquaresFour } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { upsertCollectionAction } from "@/app/actions/catalog-collections";
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

interface Collection {
  description: string;
  id: string;
  name: string;
  productCount: number;
  slug: string;
  status: "draft" | "published" | "archived";
}

interface ProductSummary {
  id: string;
  name: string;
  slug: string;
}

export function CollectionManager({
  collections,
}: {
  collections: Collection[];
  availableProducts: ProductSummary[];
}) {
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const hasFilters = Boolean(searchTerm.trim() || statusFilter);
  const filteredCollections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return collections.filter(
      (c) =>
        (!term ||
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)) &&
        (!statusFilter || c.status === statusFilter)
    );
  }, [collections, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertCollectionAction({}, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(
          editingCollection ? "Collection updated!" : "Collection created!"
        );
        setEditingCollection(null);
        setIsCreating(false);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Collection List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Collections ({collections.length})</CardTitle>
              <CardDescription>
                Curated product groups (e.g. &quot;Acrylic Essentials&quot;,
                &quot;Desk Organizers&quot;).
              </CardDescription>
            </div>
            <Button
              disabled={isCreating}
              onClick={() => {
                setEditingCollection(null);
                setIsCreating(true);
                setError(null);
              }}
              size="sm"
            >
              <Plus className="mr-1.5" size={14} /> New Collection
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
            {collections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No collections created yet.
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No collections match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredCollections.map((col) => (
                  <div
                    className="flex items-center justify-between p-4"
                    key={col.id}
                  >
                    <div className="flex items-center gap-3">
                      <SquaresFour
                        className="text-primary"
                        size={24}
                        weight="fill"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {col.name}
                          </span>
                          <Badge
                            className={
                              col.status === "published" ? "text-success" : ""
                            }
                            variant={
                              col.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {col.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {col.productCount}{" "}
                            {col.productCount === 1 ? "product" : "products"}
                          </span>
                        </div>
                        <p className="font-mono text-2xs text-muted-foreground">
                          /collections/{col.slug}
                        </p>
                        {col.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => {
                          setIsCreating(false);
                          setEditingCollection(col);
                          setError(null);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <PencilSimple size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor Form */}
      <div>
        {isCreating || editingCollection ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingCollection ? "Edit Collection" : "New Collection"}
              </CardTitle>
              <CardDescription>
                {editingCollection
                  ? `Editing "${editingCollection.name}"`
                  : "Create a curated group"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {editingCollection && (
                  <input name="id" type="hidden" value={editingCollection.id} />
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
                    htmlFor="collection-manager-collection-name"
                  >
                    Collection Name *
                  </label>
                  <Input
                    defaultValue={editingCollection?.name ?? ""}
                    id="collection-manager-collection-name"
                    name="name"
                    onChange={(e) => {
                      if (!editingCollection?.id) {
                        const slugInput = document.querySelector(
                          'input[name="slug"]'
                        ) as HTMLInputElement;
                        if (slugInput && !slugInput.dataset.touched) {
                          slugInput.value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                        }
                      }
                    }}
                    placeholder="e.g. Acrylic Essentials"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="collection-manager-slug"
                  >
                    Slug *
                  </label>
                  <Input
                    defaultValue={editingCollection?.slug ?? ""}
                    id="collection-manager-slug"
                    name="slug"
                    onChange={(e) => {
                      e.currentTarget.dataset.touched = "true";
                    }}
                    placeholder="e.g. acrylic-essentials"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="collection-manager-description"
                  >
                    Description
                  </label>
                  <textarea
                    className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    defaultValue={editingCollection?.description ?? ""}
                    id="collection-manager-description"
                    name="description"
                    placeholder="Collection intro copy..."
                    rows={3}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="collection-manager-status"
                  >
                    Status
                  </label>
                  <select
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    defaultValue={editingCollection?.status ?? "draft"}
                    id="collection-manager-status"
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
                      : editingCollection
                        ? "Update Collection"
                        : "Create Collection"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCollection(null);
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
            Select a collection to edit or click &quot;New Collection&quot;
            above.
          </div>
        )}
      </div>
    </div>
  );
}
