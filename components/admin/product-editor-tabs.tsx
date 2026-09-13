"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ArrowSquareOut,
  CheckCircle,
  CurrencyInr,
  Eye,
  Images,
  Package,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  attachProductMediaAction,
  deleteVariantAction,
  detachProductMediaAction,
  updateProductStatusAction,
  upsertVariantAction,
} from "@/app/actions/catalog-products";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  sku: string;
  title: string;
  options: Record<string, string>;
  priceMinor: number | null;
  mrpMinor: number | null;
  weightG: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  active: boolean;
  websiteEnabled: boolean;
  amazonEnabled: boolean;
  amazonUrl: string;
  asin: string;
}

interface MediaItem {
  id: string;
  variantId: string | null;
  assetId: string;
  sortOrder: number;
  storageKey: string;
  altText: string;
  originalFilename: string;
  bytes: number;
  width: number;
  height: number;
}

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryCategoryId: string | null;
  status: "draft" | "published" | "archived";
  specifications: Record<string, string>;
  care: string;
  packageContents: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: Date | null;
  variants: Variant[];
  media: MediaItem[];
}

export function ProductEditorTabs({
  product,
  categories,
}: {
  product: ProductDetails;
  categories: Category[];
}) {
  const [activeTab, setActiveTab] = useState<"details" | "variants" | "media">("variants");
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Status transitions
  const handleStatusChange = (newStatus: "draft" | "published" | "archived") => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateProductStatusAction(product.id, newStatus);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Product status changed to ${newStatus}.`);
      }
    });
  };

  // Variant submit
  const handleVariantSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertVariantAction(product.id, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(editingVariant ? "Variant updated successfully." : "Variant added successfully.");
        setEditingVariant(null);
        setIsAddingVariant(false);
      }
    });
  };

  // Variant delete
  const handleDeleteVariant = (variantId: string, sku: string) => {
    if (!confirm(`Are you sure you want to delete variant ${sku}?`)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteVariantAction(product.id, variantId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Variant ${sku} deleted.`);
      }
    });
  };

  // Media upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("altText", `${product.name} - ${file.name}`);

      const uploadRes = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      if (!uploadRes.ok || data.error) {
        setError(data.error || "Failed to upload image");
        setIsUploading(false);
        return;
      }

      // Attach to product
      startTransition(async () => {
        const attachRes = await attachProductMediaAction(product.id, data.asset.id);
        if (attachRes.error) {
          setError(attachRes.error);
        } else {
          setSuccess("Image uploaded and attached to product gallery.");
        }
        setIsUploading(false);
      });
    } catch {
      setError("Error uploading image");
      setIsUploading(false);
    }
  };

  // Media detach
  const handleDetachMedia = (mediaId: string) => {
    if (!confirm("Remove image from this product?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await detachProductMediaAction(mediaId, product.id);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Image detached from product.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Product Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Badge
            variant={product.status === "published" ? "default" : "secondary"}
            className={product.status === "published" ? "text-success text-sm" : "text-sm"}
          >
            {product.status.toUpperCase()}
          </Badge>
          <div>
            <h2 className="font-bold text-lg">{product.name}</h2>
            <p className="font-mono text-2xs text-muted-foreground">/{product.slug}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {product.status !== "published" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusChange("published")}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <CheckCircle className="mr-1.5" size={16} /> Publish to Storefront
            </Button>
          )}
          {product.status === "published" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleStatusChange("draft")}
            >
              Unpublish to Draft
            </Button>
          )}
          {product.status !== "archived" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => handleStatusChange("archived")}
              className="text-muted-foreground hover:text-destructive"
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Action blocked</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle size={20} className="shrink-0" />
          <p className="text-xs font-semibold">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("variants")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "variants"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package size={16} /> Variants & Channels ({product.variants.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "media"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Images size={16} /> Media Gallery ({product.media.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "details"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <PencilSimple size={16} /> Details & Specs
        </button>
      </div>

      {/* TAB 1: VARIANTS & CHANNELS */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Product Variants & Channels</h3>
              <p className="text-xs text-muted-foreground">
                Each variant has independent SKU, pricing, shipping weight, and sales channels (Website & Amazon).
              </p>
            </div>
            <Button
              size="sm"
              disabled={isAddingVariant}
              onClick={() => {
                setEditingVariant(null);
                setIsAddingVariant(true);
                setError(null);
              }}
            >
              <Plus className="mr-1.5" size={14} /> Add Variant
            </Button>
          </div>

          {/* Variant Form (Modal or Inline) */}
          {(isAddingVariant || editingVariant) && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>{editingVariant ? `Edit Variant (${editingVariant.sku})` : "Add New Variant"}</CardTitle>
                <CardDescription>
                  Define variant options, pricing in INR, weight for delivery quotes, and Amazon link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVariantSubmit} className="space-y-4">
                  {editingVariant && <input type="hidden" name="id" value={editingVariant.id} />}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        SKU *
                      </label>
                      <Input
                        name="sku"
                        required
                        defaultValue={editingVariant?.sku ?? ""}
                        placeholder="e.g. ZNC-ORG-CLR-2P"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        Variant Title *
                      </label>
                      <Input
                        name="title"
                        required
                        defaultValue={editingVariant?.title ?? "Standard"}
                        placeholder="e.g. Clear / Pack of 1"
                      />
                    </div>
                  </div>

                  {/* Options JSON */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Options (JSON key-value)
                    </label>
                    <Input
                      name="options"
                      defaultValue={
                        editingVariant?.options ? JSON.stringify(editingVariant.options) : "{}"
                      }
                      placeholder='e.g. {"Color": "Clear", "Pack": "2"}'
                    />
                    <p className="mt-1 text-2xs text-muted-foreground">
                      Use JSON object format like {`{"Color": "Clear", "Size": "Medium"}`}
                    </p>
                  </div>

                  {/* Pricing & Dimensions */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        Selling Price (₹ INR)
                      </label>
                      <Input
                        name="priceINR"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={editingVariant?.priceMinor ? (editingVariant.priceMinor / 100).toFixed(2) : ""}
                        placeholder="499.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        MRP (₹ INR)
                      </label>
                      <Input
                        name="mrpINR"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={editingVariant?.mrpMinor ? (editingVariant.mrpMinor / 100).toFixed(2) : ""}
                        placeholder="799.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        Weight (grams) *
                      </label>
                      <Input
                        name="weightG"
                        type="number"
                        min="1"
                        defaultValue={editingVariant?.weightG ?? ""}
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        Dimensions (L×W×H mm)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <Input
                          name="lengthMm"
                          type="number"
                          placeholder="L"
                          defaultValue={editingVariant?.lengthMm ?? ""}
                        />
                        <Input
                          name="widthMm"
                          type="number"
                          placeholder="W"
                          defaultValue={editingVariant?.widthMm ?? ""}
                        />
                        <Input
                          name="heightMm"
                          type="number"
                          placeholder="H"
                          defaultValue={editingVariant?.heightMm ?? ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channels & Status */}
                  <div className="rounded border border-border bg-muted/40 p-4 space-y-3">
                    <h4 className="font-semibold text-xs uppercase tracking-ui">Sales Channels</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="websiteEnabled"
                          defaultChecked={editingVariant?.websiteEnabled ?? false}
                          className="size-4"
                        />
                        <span className="text-xs font-medium">Enable direct Website sales</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="amazonEnabled"
                          defaultChecked={editingVariant?.amazonEnabled ?? false}
                          className="size-4"
                        />
                        <span className="text-xs font-medium">Enable Amazon outbound link</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                        Amazon Product URL
                      </label>
                      <Input
                        name="amazonUrl"
                        defaultValue={editingVariant?.amazonUrl ?? ""}
                        placeholder="https://www.amazon.in/dp/ASIN or https://amzn.in/d/..."
                      />
                      <p className="mt-1 text-2xs text-muted-foreground">
                        Supports full Amazon India URLs (e.g. /dp/ASIN) and mobile/share links (e.g. https://amzn.in/d/...).
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={editingVariant?.active ?? true}
                        className="size-4"
                      />
                      <span className="text-xs font-medium">Active variant (available for selection)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : editingVariant ? "Update Variant" : "Save Variant"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingVariant(null);
                        setIsAddingVariant(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Variant Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Amazon Link</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs font-bold">{v.sku}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs">{v.title}</span>
                        {Object.keys(v.options).length > 0 && (
                          <span className="block text-2xs text-muted-foreground">
                            {Object.entries(v.options)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(" · ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {v.priceMinor !== null ? (
                          <>
                            ₹{(v.priceMinor / 100).toLocaleString("en-IN")}
                            {v.mrpMinor !== null && v.mrpMinor > v.priceMinor && (
                              <span className="ml-1.5 text-2xs text-muted-foreground line-through">
                                ₹{(v.mrpMinor / 100).toLocaleString("en-IN")}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.weightG ? `${v.weightG}g` : <span className="text-destructive text-2xs">Missing</span>}
                      </TableCell>
                      <TableCell>
                        {v.websiteEnabled ? (
                          <span className="text-success text-xs font-semibold uppercase">Enabled</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Off</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.amazonEnabled ? (
                          v.amazonUrl ? (
                            <a
                              href={v.amazonUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 hover:underline"
                            >
                              {v.asin || "Amazon"} <ArrowSquareOut className="ml-1" size={12} />
                            </a>
                          ) : (
                            <span className="text-destructive text-xs">Missing URL</span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">Off</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.active ? "default" : "secondary"}>
                          {v.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsAddingVariant(false);
                              setEditingVariant(v);
                              setError(null);
                            }}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteVariant(v.id, v.sku)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: MEDIA GALLERY */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Media Assets</CardTitle>
                <CardDescription>
                  Upload product photos and variant-specific imagery. Images are stored securely and verified.
                </CardDescription>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button asChild size="sm" disabled={isUploading}>
                  <span>
                    <UploadSimple className="mr-1.5" size={14} />
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {product.media.length === 0 ? (
                <div className="rounded border border-dashed border-border p-12 text-center">
                  <Images className="mx-auto mb-3 text-muted-foreground/50" size={40} />
                  <p className="font-semibold text-sm">No images in this product gallery</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Upload PNG, JPG, or WebP images to display on product detail pages.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {product.media.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden border border-border bg-card"
                    >
                      <div className="relative aspect-square w-full bg-muted">
                        <Image
                          src={`/uploads/${item.storageKey}`}
                          alt={item.altText}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary px-2 py-0.5 text-2xs font-bold text-primary-foreground uppercase tracking-ui">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold">{item.originalFilename}</p>
                        <p className="text-2xs text-muted-foreground">
                          {item.width}×{item.height} px · {(item.bytes / 1024).toFixed(1)} KB
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                          <span className="text-2xs text-muted-foreground">Order: #{item.sortOrder + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDetachMedia(item.id)}
                          >
                            <Trash size={12} className="mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: CORE DETAILS */}
      {activeTab === "details" && (
        <ProductForm
          categories={categories}
          initialData={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            primaryCategoryId: product.primaryCategoryId,
            specifications: product.specifications,
            care: product.care,
            packageContents: product.packageContents,
            seoTitle: product.seoTitle,
            seoDescription: product.seoDescription,
          }}
        />
      )}
    </div>
  );
}
