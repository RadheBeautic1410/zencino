"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowSquareOut,
  Bag,
  Check,
  CheckCircle,
  Package,
  ShieldCheck,
  SpinnerGap,
  Truck,
} from "@phosphor-icons/react";
import { addToCartAction } from "@/app/actions/cart";

export interface VariantData {
  id: string;
  sku: string;
  title: string;
  options: Record<string, string>;
  optionSignature: string;
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

export interface MediaData {
  id: string;
  variantId: string | null;
  sortOrder: number;
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: { id: string; name: string; slug: string } | null;
    specifications: Record<string, string>;
    care: string;
    packageContents: string;
    seoTitle: string;
    seoDescription: string;
    variants: VariantData[];
    media: MediaData[];
  };
}

export function ProductDetailView({ product }: ProductDetailProps) {
  // Initial selected variant (default to first active variant)
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    () => product.variants.find((v) => v.active)?.id || product.variants[0]?.id || ""
  );

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  }, [product.variants, selectedVariantId]);

  // Gallery active image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart add state
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // When variant changes, see if there's a variant-specific image
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    setAddedSuccess(false);
    setCartError(null);
    const varMediaIndex = product.media.findIndex((m) => m.variantId === variantId);
    if (varMediaIndex !== -1) {
      setActiveImageIndex(varMediaIndex);
    }
  };

  const handleAddToCart = async (variantId: string) => {
    setIsAdding(true);
    setCartError(null);
    try {
      const res = await addToCartAction(variantId, 1);
      if (res.error) {
        setCartError(res.error);
      } else {
        setAddedSuccess(true);
      }
    } catch {
      setCartError("Unable to add product to bag. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const activeMedia = product.media[activeImageIndex] || product.media[0];

  const price = selectedVariant?.priceMinor ? selectedVariant.priceMinor / 100 : null;
  const mrp = selectedVariant?.mrpMinor ? selectedVariant.mrpMinor / 100 : null;
  const discountPct = price && mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:py-14">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-primary transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        {/* Gallery Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
            {activeMedia ? (
              <Image
                src={activeMedia.url}
                alt={activeMedia.altText || product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground/30">
                <Package size={64} />
              </div>
            )}

            {discountPct && (
              <span className="absolute top-4 left-4 rounded-full bg-emerald-700/90 text-white backdrop-blur-xs px-3 py-1 text-xs font-extrabold uppercase tracking-ui shadow-xs">
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.media.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
              {product.media.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                    activeImageIndex === idx
                      ? "border-primary ring-2 ring-primary/20 scale-102 shadow-xs"
                      : "border-border/80 hover:border-foreground/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={m.url}
                    alt={m.altText || `${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Purchase & Option Details */}
        <div className="lg:col-span-5 space-y-6">
          {product.category && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wider uppercase">
              <span>{product.category.name}</span>
            </div>
          )}

          <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Price Header */}
          <div className="border-b border-border/80 pb-5">
            <div className="flex items-baseline gap-3">
              {price !== null ? (
                <>
                  <span className="font-heading text-3xl md:text-4xl font-black text-foreground">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  {mrp && mrp > price && (
                    <span className="text-base text-muted-foreground/75 line-through">
                      ₹{mrp.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discountPct && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Save {discountPct}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">Price on Request</span>
              )}
            </div>
            <p className="mt-1 text-2xs text-muted-foreground">Inclusive of all applicable GST. Free shipping over ₹999.</p>
          </div>

          {/* Variant / Option Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-ui text-foreground">
                Select Option / Pack:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVariantSelect(v.id)}
                      className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-ui transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs scale-102"
                          : "border-border/80 bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span>{v.title}</span>
                      {v.priceMinor && (
                        <span className="ml-1.5 opacity-80 font-normal">
                          · ₹{(v.priceMinor / 100).toLocaleString("en-IN")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dual Purchasing Action Buttons */}
          <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-ui text-foreground">
              Ways to Purchase
            </p>

            {/* Path A: Amazon Outbound Link */}
            {selectedVariant?.amazonEnabled && (
              <div className="space-y-1.5">
                <a
                  href={`/api/outbound/amazon?variantId=${selectedVariant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF9900] hover:bg-[#FF9900]/90 text-black py-3.5 px-6 font-extrabold text-sm tracking-wide shadow-xs transition-all hover:scale-101"
                >
                  <span>Buy on Amazon Prime</span>
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
                <p className="text-center text-2xs text-muted-foreground">
                  Order with your Amazon Prime account for fast delivery & verified returns.
                </p>
              </div>
            )}

            {/* Path B: Direct Storefront Checkout */}
            {selectedVariant?.websiteEnabled && (
              <div className="pt-1 space-y-1.5">
                {addedSuccess ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-900">
                      <div className="flex items-center gap-2">
                        <Check size={18} weight="bold" className="text-emerald-700" />
                        <span>Added to your shopping bag!</span>
                      </div>
                      <Link
                        href="/cart"
                        className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold hover:bg-primary/90 uppercase tracking-ui shadow-2xs"
                      >
                        View Bag &rarr;
                      </Link>
                    </div>
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddToCart(selectedVariant.id)}
                      className="w-full text-center text-2xs text-muted-foreground hover:text-foreground py-1 font-medium transition-colors"
                    >
                      + Add another piece
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => handleAddToCart(selectedVariant.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 px-6 font-extrabold text-sm hover:bg-primary/90 shadow-sm transition-all hover:scale-101 disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <SpinnerGap className="animate-spin" size={18} />
                        <span>Adding to Bag...</span>
                      </>
                    ) : (
                      <>
                        <Bag size={18} weight="bold" />
                        <span>Order Direct with Zencino</span>
                      </>
                    )}
                  </button>
                )}

                {cartError && (
                  <p className="mt-2 text-xs text-destructive text-center font-medium">
                    {cartError}
                  </p>
                )}

                <p className="text-center text-2xs text-muted-foreground">
                  Direct orders ship within 24h · Free delivery &gt; ₹999 · Secure checkout
                </p>
              </div>
            )}

            {!selectedVariant?.amazonEnabled && !selectedVariant?.websiteEnabled && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                This variant is currently being replenished.
              </div>
            )}
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/70 text-xs text-foreground">
              <ShieldCheck className="text-emerald-700 shrink-0" size={20} weight="bold" />
              <span>Optical grade clear acrylic</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/70 text-xs text-foreground">
              <Truck className="text-emerald-700 shrink-0" size={20} weight="bold" />
              <span>Protective cushioned packaging</span>
            </div>
          </div>

          {/* Specifications Table */}
          {Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-border/80 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-ui text-foreground mb-3">
                Product Specifications
              </h3>
              <dl className="divide-y divide-border/60 text-xs">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 py-2.5">
                    <dt className="text-muted-foreground font-medium">{k}</dt>
                    <dd className="col-span-2 text-foreground font-semibold">{v}</dd>
                  </div>
                ))}
                {selectedVariant?.weightG && (
                  <div className="grid grid-cols-3 py-2.5">
                    <dt className="text-muted-foreground font-medium">Weight</dt>
                    <dd className="col-span-2 text-foreground font-semibold">{selectedVariant.weightG} grams</dd>
                  </div>
                )}
                {selectedVariant?.lengthMm && (
                  <div className="grid grid-cols-3 py-2.5">
                    <dt className="text-muted-foreground font-medium">Dimensions</dt>
                    <dd className="col-span-2 text-foreground font-semibold">
                      {selectedVariant.lengthMm} × {selectedVariant.widthMm} × {selectedVariant.heightMm} mm
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Care Instructions */}
          {product.care && (
            <div className="border-t border-border/80 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-ui text-foreground mb-2">
                Care Instructions
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{product.care}</p>
            </div>
          )}

          {/* Package Contents */}
          {product.packageContents && (
            <div className="border-t border-border/80 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-ui text-foreground mb-2">
                What&apos;s Included
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{product.packageContents}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
