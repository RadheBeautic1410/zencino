"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bag,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import { removeItemAction, updateQuantityAction } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";

export interface CartLineItem {
  id: string;
  variantId: string;
  sku: string;
  variantTitle: string;
  unitPriceMinor: number;
  mrpMinor: number | null;
  quantity: number;
  lineTotalMinor: number;
  weightG: number;
  options: Record<string, string>;
  productId: string;
  productName: string;
  productSlug: string;
  image: string | null;
  stockAvailable: number;
  isAvailable: boolean;
}

export interface CartViewProps {
  cart: {
    cartId: string | null;
    totalItems: number;
    subtotalMinor: number;
    items: CartLineItem[];
  };
}

export function CartView({ cart }: CartViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.subtotalMinor / 100;
  const freeShippingThreshold = 999;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleUpdateQty = (itemId: string, newQty: number) => {
    setError(null);
    startTransition(async () => {
      const res = await updateQuantityAction(itemId, newQty);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleRemove = (itemId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await removeItemAction(itemId);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary mb-5 shadow-xs">
          <Bag size={36} weight="bold" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
          Your shopping bag is empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Explore our collection of optical acrylic organizers and modern essentials to add items to your bag.
        </p>
        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-101"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="border-b border-border/80 pb-6">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
          Shopping Bag ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
        </h1>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Free Shipping Meter */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        {amountNeededForFreeShipping > 0 ? (
          <p className="text-xs font-medium text-foreground">
            Add <span className="font-bold text-emerald-700">₹{amountNeededForFreeShipping.toLocaleString("en-IN")}</span> more of eligible items to unlock <span className="font-bold uppercase tracking-ui text-emerald-800">Complimentary Pan-India Shipping</span>!
          </p>
        ) : (
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-2">
            <Truck size={18} weight="bold" /> You have unlocked Complimentary Shipping on this order!
          </p>
        )}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
        {/* Cart Item Lines */}
        <div className="lg:col-span-8 divide-y divide-border/70 border-y border-border/80">
          {cart.items.map((item) => {
            const price = item.unitPriceMinor / 100;
            const lineTotal = item.lineTotalMinor / 100;
            const mrp = item.mrpMinor ? item.mrpMinor / 100 : null;

            return (
              <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-5 items-start">
                {/* Thumbnail */}
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-muted/20"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground/30">
                      <Package size={24} />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-heading font-bold text-base leading-snug text-foreground hover:text-primary transition-colors">
                    <Link href={`/products/${item.productSlug}`}>
                      {item.productName}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Variant: <span className="font-semibold text-foreground">{item.variantTitle}</span>
                  </p>
                  <p className="font-mono text-3xs text-muted-foreground/70">SKU: {item.sku}</p>

                  {!item.isAvailable && (
                    <p className="text-2xs font-semibold text-destructive flex items-center gap-1 mt-1">
                      <WarningCircle size={12} /> Stock unavailable for requested quantity
                    </p>
                  )}

                  {/* Quantity Stepper & Remove */}
                  <div className="pt-3 flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-border/80 bg-muted/30 px-1 py-0.5">
                      <button
                        type="button"
                        disabled={isPending || item.quantity <= 1}
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-full transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus size={13} weight="bold" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={isPending || item.quantity >= item.stockAvailable}
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-full transition-colors"
                        title="Increase quantity"
                      >
                        <Plus size={13} weight="bold" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemove(item.id)}
                      className="text-2xs text-muted-foreground hover:text-destructive flex items-center gap-1 font-semibold uppercase tracking-ui transition-colors"
                    >
                      <Trash size={13} /> Remove
                    </button>
                  </div>
                </div>

                {/* Line Price */}
                <div className="text-right sm:self-center">
                  <p className="font-heading text-lg font-extrabold text-foreground">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-2xs text-muted-foreground">
                      ₹{price.toLocaleString("en-IN")} each
                    </p>
                  )}
                  {mrp && mrp > price && (
                    <p className="text-2xs text-emerald-700 font-bold">
                      Save ₹{((mrp - price) * item.quantity).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-sm">
          <h2 className="font-heading text-base font-bold uppercase tracking-ui text-foreground">Order Summary</h2>

          <div className="space-y-3 text-sm border-b border-border/80 pb-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-semibold text-foreground">
                {subtotal >= freeShippingThreshold ? (
                  <span className="text-emerald-700 font-bold uppercase tracking-ui text-xs">FREE</span>
                ) : (
                  "₹79 (Standard)"
                )}
              </span>
            </div>
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>Taxes (GST 18%)</span>
              <span>Included in product price</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="font-heading font-bold text-base text-foreground">Estimated Total</span>
            <span className="font-heading text-2xl font-black text-foreground">
              ₹{(subtotal + (subtotal >= freeShippingThreshold ? 0 : 79)).toLocaleString("en-IN")}
            </span>
          </div>

          {hasUnavailableItems && (
            <p className="text-xs text-destructive">
              Please adjust or remove unavailable items before proceeding.
            </p>
          )}

          <Button
            asChild
            disabled={hasUnavailableItems}
            className="w-full py-6 font-extrabold text-xs uppercase tracking-ui rounded-full shadow-sm hover:scale-101 transition-all"
          >
            <Link href="/checkout">
              <span>Proceed to Checkout</span>
              <ArrowRight className="ml-2" size={16} weight="bold" />
            </Link>
          </Button>

          <div className="space-y-2 pt-3 text-2xs text-muted-foreground border-t border-border/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} weight="bold" className="text-emerald-700" />
              <span>Safe and encrypted checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} weight="bold" className="text-emerald-700" />
              <span>Pan-India shipping with real-time tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
