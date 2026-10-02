"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  Images,
  Package,
  PencilSimple,
  Plus,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState, useTransition } from "react";
import {
  attachProductMediaBatchAction,
  deleteVariantAction,
  detachProductMediaAction,
  updateProductStatusAction,
  upsertVariantAction,
} from "@/app/actions/catalog-products";
import { ProductForm } from "@/components/admin/product-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMediaAssetUrl } from "@/lib/media/url";

interface Category {
  id: string;
  name: string;
}

interface Variant {
  active: boolean;
  amazonEnabled: boolean;
  amazonUrl: string;
  asin: string;
  heightMm: number | null;
  id: string;
  lengthMm: number | null;
  mrpMinor: number | null;
  options: Record<string, string>;
  priceMinor: number | null;
  sku: string;
  title: string;
  websiteEnabled: boolean;
  weightG: number | null;
  widthMm: number | null;
}

interface MediaItem {
  altText: string;
  assetId: string;
  bytes: number;
  height: number;
  id: string;
  originalFilename: string;
  sortOrder: number;
  storageKey: string;
  variantId: string | null;
  width: number;
}

interface ProductDetails {
  care: string;
  description: string;
  id: string;
  media: MediaItem[];
  name: string;
  packageContents: string;
  primaryCategoryId: string | null;
  publishedAt: Date | null;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  specifications: Record<string, string>;
  status: "draft" | "published" | "archived";
  variants: Variant[];
}

export function ProductEditorTabs({
  product,
  categories,
}: {
  product: ProductDetails;
  categories: Category[];
}) {
  const [activeTab, setActiveTab] = useState<"details" | "variants" | "media">(
    "variants"
  );
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Status transitions
  const handleStatusChange = (
    newStatus: "draft" | "published" | "archived"
  ) => {
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
        setSuccess(
          editingVariant
            ? "Variant updated successfully."
            : "Variant added successfully."
        );
        setEditingVariant(null);
        setIsAddingVariant(false);
      }
    });
  };

  // Variant delete
  const handleDeleteVariant = async (variantId: string, sku: string) => {
    const confirmed = await confirm({
      title: "Delete variant?",
      description: `Are you sure you want to delete variant ${sku}?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
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

  // Media upload (supports selecting multiple images at once)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      return;
    }

    // Allow re-selecting the same files later.
    input.value = "";

    setIsUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    setError(null);
    setSuccess(null);

    const uploadedAssetIds: string[] = [];
    const failures: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("altText", `${product.name} - ${file.name}`);

        const uploadRes = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await uploadRes.json();
        if (uploadRes.ok && !data.error) {
          uploadedAssetIds.push(data.asset.id);
        } else {
          failures.push(`${file.name}: ${data.error || "upload failed"}`);
        }
      } catch {
        failures.push(`${file.name}: upload failed`);
      }

      setUploadProgress((prev) =>
        prev ? { ...prev, done: prev.done + 1 } : prev
      );
    }

    if (uploadedAssetIds.length === 0) {
      setError(
        failures.length > 0
          ? `No images uploaded. ${failures.join("; ")}`
          : "No images uploaded."
      );
      setIsUploading(false);
      setUploadProgress(null);
      return;
    }

    // Attach in one call so gallery sort order stays consistent.
    startTransition(async () => {
      const attachRes = await attachProductMediaBatchAction(
        product.id,
        uploadedAssetIds
      );
      if (attachRes.error) {
        setError(attachRes.error);
      } else {
        setSuccess(
          `${uploadedAssetIds.length} image${
            uploadedAssetIds.length === 1 ? "" : "s"
          } uploaded and attached to product gallery.`
        );
        if (failures.length > 0) {
          setError(
            `${failures.length} file(s) failed. ${failures.join("; ")}`
          );
        }
      }
      setIsUploading(false);
      setUploadProgress(null);
    });
  };

  // Media detach
  const handleDetachMedia = async (mediaId: string) => {
    const confirmed = await confirm({
      title: "Remove image?",
      description: "Remove this image from the product gallery?",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
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
      {confirmDialog}
      {/* Product Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Badge
            className={
              product.status === "published"
                ? "text-success text-sm"
                : "text-sm"
            }
            variant={product.status === "published" ? "default" : "secondary"}
          >
            {product.status.toUpperCase()}
          </Badge>
          <div>
            <h2 className="font-bold text-lg">{product.name}</h2>
            <p className="font-mono text-2xs text-muted-foreground">
              /{product.slug}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {product.status !== "published" && (
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={isPending}
              onClick={() => handleStatusChange("published")}
              size="sm"
            >
              <CheckCircle className="mr-1.5" size={16} /> Publish to Storefront
            </Button>
          )}
          {product.status === "published" && (
            <Button
              disabled={isPending}
              onClick={() => handleStatusChange("draft")}
              size="sm"
              variant="secondary"
            >
              Unpublish to Draft
            </Button>
          )}
          {product.status !== "archived" && (
            <Button
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={() => handleStatusChange("archived")}
              size="sm"
              variant="ghost"
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold">Action blocked</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle className="shrink-0" size={20} />
          <p className="text-xs font-semibold">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "variants"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("variants")}
          type="button"
        >
          <Package size={16} /> Variants & Channels ({product.variants.length})
        </button>
        <button
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "media"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("media")}
          type="button"
        >
          <Images size={16} /> Media Gallery ({product.media.length})
        </button>
        <button
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-ui transition-colors ${
            activeTab === "details"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("details")}
          type="button"
        >
          <PencilSimple size={16} /> Details & Specs
        </button>
      </div>

      {/* TAB 1: VARIANTS & CHANNELS */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">
                Product Variants & Channels
              </h3>
              <p className="text-xs text-muted-foreground">
                Each variant has independent SKU, pricing, shipping weight, and
                sales channels (Website & Amazon).
              </p>
            </div>
            <Button
              disabled={isAddingVariant}
              onClick={() => {
                setEditingVariant(null);
                setIsAddingVariant(true);
                setError(null);
              }}
              size="sm"
            >
              <Plus className="mr-1.5" size={14} /> Add Variant
            </Button>
          </div>

          {/* Variant Form (Modal or Inline) */}
          {(isAddingVariant || editingVariant) && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle>
                  {editingVariant
                    ? `Edit Variant (${editingVariant.sku})`
                    : "Add New Variant"}
                </CardTitle>
                <CardDescription>
                  Define variant options, pricing in INR, weight for delivery
                  quotes, and Amazon link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleVariantSubmit}>
                  {editingVariant && (
                    <input name="id" type="hidden" value={editingVariant.id} />
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-sku"
                      >
                        SKU *
                      </label>
                      <Input
                        defaultValue={editingVariant?.sku ?? ""}
                        id="product-editor-tabs-sku"
                        name="sku"
                        placeholder="e.g. ZNC-ORG-CLR-2P"
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-variant-title"
                      >
                        Variant Title *
                      </label>
                      <Input
                        defaultValue={editingVariant?.title ?? "Standard"}
                        id="product-editor-tabs-variant-title"
                        name="title"
                        placeholder="e.g. Clear / Pack of 1"
                        required
                      />
                    </div>
                  </div>

                  {/* Options JSON */}
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="product-editor-tabs-options-json-key-value"
                    >
                      Options (JSON key-value)
                    </label>
                    <Input
                      defaultValue={
                        editingVariant?.options
                          ? JSON.stringify(editingVariant.options)
                          : "{}"
                      }
                      id="product-editor-tabs-options-json-key-value"
                      name="options"
                      placeholder='e.g. {"Color": "Clear", "Pack": "2"}'
                    />
                    <p className="mt-1 text-2xs text-muted-foreground">
                      Use JSON object format like{" "}
                      {`{"Color": "Clear", "Size": "Medium"}`}
                    </p>
                  </div>

                  {/* Pricing & Dimensions */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-selling-price-inr"
                      >
                        Selling Price (₹ INR)
                      </label>
                      <Input
                        defaultValue={
                          editingVariant?.priceMinor
                            ? (editingVariant.priceMinor / 100).toFixed(2)
                            : ""
                        }
                        id="product-editor-tabs-selling-price-inr"
                        min="0"
                        name="priceINR"
                        placeholder="499.00"
                        step="0.01"
                        type="number"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-mrp-inr"
                      >
                        MRP (₹ INR)
                      </label>
                      <Input
                        defaultValue={
                          editingVariant?.mrpMinor
                            ? (editingVariant.mrpMinor / 100).toFixed(2)
                            : ""
                        }
                        id="product-editor-tabs-mrp-inr"
                        min="0"
                        name="mrpINR"
                        placeholder="799.00"
                        step="0.01"
                        type="number"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-weight-grams"
                      >
                        Weight (grams) *
                      </label>
                      <Input
                        defaultValue={editingVariant?.weightG ?? ""}
                        id="product-editor-tabs-weight-grams"
                        min="1"
                        name="weightG"
                        placeholder="250"
                        type="number"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-dimensions-l-w-h"
                      >
                        Dimensions (L×W×H mm)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <Input
                          defaultValue={editingVariant?.lengthMm ?? ""}
                          id="product-editor-tabs-dimensions-l-w-h"
                          inputMode="decimal"
                          min="0"
                          name="lengthMm"
                          placeholder="L"
                          step="0.01"
                          type="number"
                        />
                        <Input
                          defaultValue={editingVariant?.widthMm ?? ""}
                          inputMode="decimal"
                          min="0"
                          name="widthMm"
                          placeholder="W"
                          step="0.01"
                          type="number"
                        />
                        <Input
                          defaultValue={editingVariant?.heightMm ?? ""}
                          inputMode="decimal"
                          min="0"
                          name="heightMm"
                          placeholder="H"
                          step="0.01"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channels & Status */}
                  <div className="rounded border border-border bg-muted/40 p-4 space-y-3">
                    <h4 className="font-semibold text-xs uppercase tracking-ui">
                      Sales Channels
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="size-4"
                          defaultChecked={
                            editingVariant?.websiteEnabled ?? false
                          }
                          name="websiteEnabled"
                          type="checkbox"
                        />
                        <span className="text-xs font-medium">
                          Enable direct Website sales
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          className="size-4"
                          defaultChecked={
                            editingVariant?.amazonEnabled ?? false
                          }
                          name="amazonEnabled"
                          type="checkbox"
                        />
                        <span className="text-xs font-medium">
                          Enable Amazon outbound link
                        </span>
                      </label>
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                        htmlFor="product-editor-tabs-amazon-product-url"
                      >
                        Amazon Product URL
                      </label>
                      <Input
                        defaultValue={editingVariant?.amazonUrl ?? ""}
                        id="product-editor-tabs-amazon-product-url"
                        name="amazonUrl"
                        placeholder="https://www.amazon.in/dp/ASIN or https://amzn.in/d/..."
                      />
                      <p className="mt-1 text-2xs text-muted-foreground">
                        Supports full Amazon India URLs (e.g. /dp/ASIN) and
                        mobile/share links (e.g. https://amzn.in/d/...).
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        className="size-4"
                        defaultChecked={editingVariant?.active ?? true}
                        name="active"
                        type="checkbox"
                      />
                      <span className="text-xs font-medium">
                        Active variant (available for selection)
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button disabled={isPending} type="submit">
                      {isPending
                        ? "Saving..."
                        : editingVariant
                          ? "Update Variant"
                          : "Save Variant"}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingVariant(null);
                        setIsAddingVariant(false);
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
                      <TableCell className="font-mono text-xs font-bold">
                        {v.sku}
                      </TableCell>
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
                        {v.priceMinor === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            ₹{(v.priceMinor / 100).toLocaleString("en-IN")}
                            {v.mrpMinor !== null &&
                              v.mrpMinor > v.priceMinor && (
                                <span className="ml-1.5 text-2xs text-muted-foreground line-through">
                                  ₹{(v.mrpMinor / 100).toLocaleString("en-IN")}
                                </span>
                              )}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.weightG ? (
                          `${v.weightG}g`
                        ) : (
                          <span className="text-destructive text-2xs">
                            Missing
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.websiteEnabled ? (
                          <span className="text-success text-xs font-semibold uppercase">
                            Enabled
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Off
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.amazonEnabled ? (
                          v.amazonUrl ? (
                            <a
                              className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 hover:underline"
                              href={v.amazonUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {v.asin || "Amazon"}{" "}
                              <ArrowSquareOut className="ml-1" size={12} />
                            </a>
                          ) : (
                            <span className="text-destructive text-xs">
                              Missing URL
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Off
                          </span>
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
                            onClick={() => {
                              setIsAddingVariant(false);
                              setEditingVariant(v);
                              setError(null);
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteVariant(v.id, v.sku)}
                            size="sm"
                            variant="ghost"
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
                  Upload product photos and variant-specific imagery. Images are
                  stored securely and verified.
                </CardDescription>
              </div>
              <label className="cursor-pointer">
                <input
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  disabled={isUploading}
                  multiple
                  onChange={handleFileUpload}
                  type="file"
                />
                <Button asChild disabled={isUploading} size="sm">
                  <span>
                    <UploadSimple className="mr-1.5" size={14} />
                    {isUploading
                      ? `Uploading${uploadProgress ? ` ${uploadProgress.done}/${uploadProgress.total}` : ""}...`
                      : "Upload Images"}
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {product.media.length === 0 ? (
                <div className="rounded border border-dashed border-border p-12 text-center">
                  <Images
                    className="mx-auto mb-3 text-muted-foreground/50"
                    size={40}
                  />
                  <p className="font-semibold text-sm">
                    No images in this product gallery
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Upload PNG, JPG, or WebP images to display on product detail
                    pages. You can select multiple files at once.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {product.media.map((item, index) => (
                    <div
                      className="group relative overflow-hidden border border-border bg-card"
                      key={item.id}
                    >
                      <div className="relative aspect-square w-full bg-muted">
                        <Image
                          alt={item.altText}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          src={getMediaAssetUrl(item.storageKey)}
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary px-2 py-0.5 text-2xs font-bold text-primary-foreground uppercase tracking-ui">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-semibold">
                          {item.originalFilename}
                        </p>
                        <p className="text-2xs text-muted-foreground">
                          {item.width}×{item.height} px ·{" "}
                          {(item.bytes / 1024).toFixed(1)} KB
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                          <span className="text-2xs text-muted-foreground">
                            Order: #{item.sortOrder + 1}
                          </span>
                          <Button
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDetachMedia(item.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash className="mr-1" size={12} /> Remove
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
