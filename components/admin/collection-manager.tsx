"use client";

import { useState, useTransition } from "react";
import { PencilSimple, Plus, SquaresFour, Trash } from "@phosphor-icons/react";
import {
  addProductToCollectionAction,
  removeProductFromCollectionAction,
  upsertCollectionAction,
} from "@/app/actions/catalog-collections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published" | "archived";
  productCount: number;
}

interface ProductSummary {
  id: string;
  name: string;
  slug: string;
}

export function CollectionManager({
  collections,
  availableProducts,
}: {
  collections: Collection[];
  availableProducts: ProductSummary[];
}) {
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setSuccess(editingCollection ? "Collection updated!" : "Collection created!");
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
                Curated product groups (e.g. &quot;Acrylic Essentials&quot;, &quot;Desk Organizers&quot;).
              </CardDescription>
            </div>
            <Button
              size="sm"
              disabled={isCreating}
              onClick={() => {
                setEditingCollection(null);
                setIsCreating(true);
                setError(null);
              }}
            >
              <Plus className="mr-1.5" size={14} /> New Collection
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {collections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No collections created yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {collections.map((col) => (
                  <div key={col.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <SquaresFour className="text-primary" size={24} weight="fill" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{col.name}</span>
                          <Badge
                            variant={col.status === "published" ? "default" : "secondary"}
                            className={col.status === "published" ? "text-success" : ""}
                          >
                            {col.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {col.productCount} {col.productCount === 1 ? "product" : "products"}
                          </span>
                        </div>
                        <p className="font-mono text-2xs text-muted-foreground">/collections/{col.slug}</p>
                        {col.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCreating(false);
                          setEditingCollection(col);
                          setError(null);
                        }}
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
        {(isCreating || editingCollection) ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingCollection ? "Edit Collection" : "New Collection"}</CardTitle>
              <CardDescription>
                {editingCollection ? `Editing "${editingCollection.name}"` : "Create a curated group"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingCollection && <input type="hidden" name="id" value={editingCollection.id} />}

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
                    Collection Name *
                  </label>
                  <Input
                    name="name"
                    required
                    defaultValue={editingCollection?.name ?? ""}
                    placeholder="e.g. Acrylic Essentials"
                    onChange={(e) => {
                      if (!editingCollection?.id) {
                        const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement;
                        if (slugInput && !slugInput.dataset.touched) {
                          slugInput.value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Slug *
                  </label>
                  <Input
                    name="slug"
                    required
                    defaultValue={editingCollection?.slug ?? ""}
                    placeholder="e.g. acrylic-essentials"
                    onChange={(e) => {
                      e.currentTarget.dataset.touched = "true";
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingCollection?.description ?? ""}
                    placeholder="Collection intro copy..."
                    className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingCollection?.status ?? "draft"}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? "Saving..." : editingCollection ? "Update Collection" : "Create Collection"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingCollection(null);
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
            Select a collection to edit or click &quot;New Collection&quot; above.
          </div>
        )}
      </div>
    </div>
  );
}
