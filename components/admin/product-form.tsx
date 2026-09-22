"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { upsertProductAction } from "@/app/actions/catalog-products";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    () => {
      if (
        initialData?.specifications &&
        Object.keys(initialData.specifications).length > 0
      ) {
        return Object.entries(initialData.specifications).map(
          ([key, value]) => ({ key, value })
        );
      }
      return [
        { key: "Material", value: "" },
        { key: "Finish", value: "" },
      ];
    }
  );

  const handleAddSpec = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {initialData?.id && (
        <input name="id" type="hidden" value={initialData.id} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Title, URL handle, and detailed product description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-product-name"
                >
                  Product Name *
                </label>
                <Input
                  defaultValue={initialData?.name ?? ""}
                  id="product-form-product-name"
                  name="name"
                  onChange={(e) => {
                    if (!initialData?.id) {
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
                  placeholder="e.g. Acrylic Pen Holder 2-Compartment"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-url-slug"
                >
                  URL Slug *
                </label>
                <Input
                  defaultValue={initialData?.slug ?? ""}
                  id="product-form-url-slug"
                  name="slug"
                  onChange={(e) => {
                    e.currentTarget.dataset.touched = "true";
                  }}
                  placeholder="e.g. acrylic-pen-holder-2-compartment"
                  required
                />
                <p className="mt-1 font-mono text-2xs text-muted-foreground">
                  Public URL: /products/{initialData?.slug || "slug"}
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-description"
                >
                  Description
                </label>
                <textarea
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue={initialData?.description ?? ""}
                  id="product-form-description"
                  name="description"
                  placeholder="Compelling product description highlighting features and uses..."
                  rows={5}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-primary-category"
                >
                  Primary Category *
                </label>
                <select
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue={initialData?.primaryCategoryId ?? ""}
                  id="product-form-primary-category"
                  name="primaryCategoryId"
                  required
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
                <CardDescription>
                  Attribute key-value pairs (Material, Finish, Capacity, etc.)
                </CardDescription>
              </div>
              <Button
                onClick={handleAddSpec}
                size="sm"
                type="button"
                variant="secondary"
              >
                Add Attribute
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {specs.map((item, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: editor rows are positional; their content changes on every keystroke so it cannot be a stable key.
                <div className="flex items-center gap-2" key={index}>
                  <Input
                    className="flex-1"
                    onChange={(e) =>
                      handleSpecChange(index, "key", e.target.value)
                    }
                    placeholder="Attribute (e.g. Material)"
                    value={item.key}
                  />
                  <Input
                    className="flex-1"
                    onChange={(e) =>
                      handleSpecChange(index, "value", e.target.value)
                    }
                    placeholder="Value (e.g. Premium Clear Acrylic)"
                    value={item.value}
                  />
                  <Button
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSpec(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
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
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-care-instructions"
                >
                  Care Instructions
                </label>
                <textarea
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue={initialData?.care ?? ""}
                  id="product-form-care-instructions"
                  name="care"
                  placeholder="e.g. Wipe with a damp microfiber cloth. Do not use abrasive cleaners or harsh chemicals."
                  rows={3}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-package-contents"
                >
                  Package Contents
                </label>
                <textarea
                  className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue={initialData?.packageContents ?? ""}
                  id="product-form-package-contents"
                  name="packageContents"
                  placeholder="e.g. 1 x Acrylic 2-Compartment Organizer, Protective Packaging."
                  rows={2}
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
              <CardDescription>
                Search engine and social sharing tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-seo-title"
                >
                  SEO Title
                </label>
                <Input
                  defaultValue={initialData?.seoTitle ?? ""}
                  id="product-form-seo-title"
                  name="seoTitle"
                  placeholder="Zencino | Premium Clear Acrylic Organizer"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="product-form-meta-description"
                >
                  Meta Description
                </label>
                <textarea
                  className="w-full border border-border bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue={initialData?.seoDescription ?? ""}
                  id="product-form-meta-description"
                  name="seoDescription"
                  placeholder="Discover modern acrylic organization solutions from Zencino..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-6 space-y-3">
            <Button
              className="w-full py-5 text-sm font-semibold"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Saving..."
                : initialData?.id
                  ? "Update Product Details"
                  : "Save & Configure Variants"}
            </Button>
            <Button
              className="w-full"
              onClick={() => router.back()}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
