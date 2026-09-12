"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertProductAction } from "@/app/actions/catalog-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    primaryCategoryId?: string | null;
    specifications?: Record<string, string>;
    care?: string;
    packageContents?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Specifications key-value pairs state
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(() => {
    if (initialData?.specifications && Object.keys(initialData.specifications).length > 0) {
      return Object.entries(initialData.specifications).map(([key, value]) => ({ key, value }));
    }
    return [
      { key: "Material", value: "" },
      { key: "Finish", value: "" },
    ];
  });

  const handleAddSpec = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...specs];
    next[index][field] = val;
    setSpecs(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Build specifications object
    const specObj: Record<string, string> = {};
    for (const item of specs) {
      if (item.key.trim() && item.value.trim()) {
        specObj[item.key.trim()] = item.value.trim();
      }
    }
    formData.set("specifications", JSON.stringify(specObj));

    startTransition(async () => {
      const res = await upsertProductAction({}, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.id) {
        router.push(`/admin/products/${res.id}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Title, URL handle, and detailed product description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Product Name *
                </label>
                <Input
                  name="name"
                  required
                  defaultValue={initialData?.name ?? ""}
                  placeholder="e.g. Acrylic Pen Holder 2-Compartment"
                  onChange={(e) => {
                    if (!initialData?.id) {
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
                  URL Slug *
                </label>
                <Input
                  name="slug"
                  required
                  defaultValue={initialData?.slug ?? ""}
                  placeholder="e.g. acrylic-pen-holder-2-compartment"
                  onChange={(e) => {
                    e.currentTarget.dataset.touched = "true";
                  }}
                />
                <p className="mt-1 font-mono text-2xs text-muted-foreground">
                  Public URL: /products/{initialData?.slug || "slug"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={5}
                  defaultValue={initialData?.description ?? ""}
                  placeholder="Compelling product description highlighting features and uses..."
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Primary Category *
                </label>
                <select
                  name="primaryCategoryId"
                  required
                  defaultValue={initialData?.primaryCategoryId ?? ""}
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Attribute key-value pairs (Material, Finish, Capacity, etc.)</CardDescription>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddSpec}>
                Add Attribute
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {specs.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Attribute (e.g. Material)"
                    value={item.key}
                    onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g. Premium Clear Acrylic)"
                    value={item.value}
                    onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSpec(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Care & Package Contents */}
          <Card>
            <CardHeader>
              <CardTitle>Care & Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Care Instructions
                </label>
                <textarea
                  name="care"
                  rows={3}
                  defaultValue={initialData?.care ?? ""}
                  placeholder="e.g. Wipe with a damp microfiber cloth. Do not use abrasive cleaners or harsh chemicals."
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Package Contents
                </label>
                <textarea
                  name="packageContents"
                  rows={2}
                  defaultValue={initialData?.packageContents ?? ""}
                  placeholder="e.g. 1 x Acrylic 2-Compartment Organizer, Protective Packaging."
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings (SEO & Submit) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
              <CardDescription>Search engine and social sharing tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  SEO Title
                </label>
                <Input
                  name="seoTitle"
                  defaultValue={initialData?.seoTitle ?? ""}
                  placeholder="Zencino | Premium Clear Acrylic Organizer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Meta Description
                </label>
                <textarea
                  name="seoDescription"
                  rows={3}
                  defaultValue={initialData?.seoDescription ?? ""}
                  placeholder="Discover modern acrylic organization solutions from Zencino..."
                  className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-6 space-y-3">
            <Button type="submit" disabled={isPending} className="w-full py-5 text-sm font-semibold">
              {isPending ? "Saving..." : initialData?.id ? "Update Product Details" : "Save & Configure Variants"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
