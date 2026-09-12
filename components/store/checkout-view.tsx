"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  Lock,
  Package,
  ShieldCheck,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import { createCheckoutQuoteAction, type QuoteActionResult } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CheckoutCartItem {
  id: string;
  variantId: string;
  sku: string;
  variantTitle: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  productName: string;
  productSlug: string;
  image: string | null;
}

export interface CheckoutViewProps {
  cart: {
    cartId: string | null;
    totalItems: number;
    subtotalMinor: number;
    items: CheckoutCartItem[];
  };
}

export function CheckoutView({ cart }: CheckoutViewProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteActionResult["quote"] | null>(null);

  const subtotal = cart.subtotalMinor / 100;
  const standardShipping = subtotal >= 999 ? 0 : 79;
  const estimatedTotal = subtotal + standardShipping;

  const handleCalculateQuote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createCheckoutQuoteAction(formData);
      if (res.error) {
        setError(res.error);
        setQuoteResult(null);
      } else if (res.quote) {
        setQuoteResult(res.quote);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Checkout & Delivery
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide your delivery address to generate a verified order quote.
          </p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-ui text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Bag
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Delivery Address Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCalculateQuote} className="border border-border bg-card p-6 md:p-8 space-y-5">
            <h2 className="text-base font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
              <Truck size={18} /> Shipping & Contact Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Full Name (Recipient) *
                </label>
                <Input name="recipient" required placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Phone Number (For Delivery SMS) *
                </label>
                <Input name="phone" required type="tel" placeholder="e.g. 9876543210" maxLength={15} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                Address Line 1 (House/Flat No., Building, Street) *
              </label>
              <Input name="line1" required placeholder="e.g. Flat 402, Lotus Residency, 5th Cross" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                Address Line 2 (Area, Landmark - Optional)
              </label>
              <Input name="line2" placeholder="e.g. Near HDFC Bank, Indiranagar" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  PIN Code *
                </label>
                <Input
                  name="postcode"
                  required
                  placeholder="e.g. 560038"
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  title="Please enter a valid 6-digit Indian PIN code"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  City *
                </label>
                <Input name="city" required placeholder="e.g. Bengaluru" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  State *
                </label>
                <Input name="state" required placeholder="e.g. Karnataka" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isPending} className="w-full py-5 text-xs font-bold uppercase tracking-ui">
                {isPending ? "Calculating Verified Quote..." : "Verify Address & Calculate Quote"}
              </Button>
            </div>
          </form>

          {/* Quote Verified Card */}
          {quoteResult && (
            <div className="rounded-2xl border border-success/40 bg-success/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-success font-bold text-sm">
                <CheckCircle size={20} />
                <span>Delivery Serviceable to PIN Code!</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quote #{quoteResult.attemptId.slice(0, 12)} generated. Rates locked for 60 minutes.
              </p>
              <div className="rounded border border-border bg-background p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Subtotal:</span>
                  <span className="font-semibold">₹{(quoteResult.subtotalMinor / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier Delivery:</span>
                  <span className="font-semibold text-success">
                    {quoteResult.shippingMinor === 0 ? "FREE" : `₹${(quoteResult.shippingMinor / 100).toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18% inclusive):</span>
                  <span className="font-semibold">₹{(quoteResult.taxMinor / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                  <span>Payable Total:</span>
                  <span className="text-base text-foreground">₹{(quoteResult.totalMinor / 100).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Phase 6 Launch Notice & Amazon Alternative */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-ui text-amber-900 dark:text-amber-300">
              <Lock size={16} /> Online Payment Gateway Notice
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Direct prepaid website transactions are opening in <strong>Phase 6</strong> once the payment provider integration is live.
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              If you need delivery right away, our full catalog is available on <strong>Amazon India</strong> with same-day and next-day Prime dispatch!
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded bg-[#FF9900] px-4 py-2 text-xs font-bold uppercase tracking-ui text-black hover:bg-[#FF9900]/90"
              >
                Shop via Amazon India <ArrowSquareOut size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-bold uppercase tracking-ui">Items in Order ({cart.totalItems})</h2>

          <div className="divide-y divide-border max-h-96 overflow-y-auto pr-2">
            {cart.items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 items-center">
                <div className="relative size-14 shrink-0 overflow-hidden border border-border bg-muted/40">
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground/40">
                      <Package size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">{item.productName}</p>
                  <p className="text-2xs text-muted-foreground truncate">{item.variantTitle} · Qty: {item.quantity}</p>
                </div>
                <div className="text-right font-bold text-xs">
                  ₹{(item.lineTotalMinor / 100).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-foreground">
                {subtotal >= 999 ? <span className="text-success font-bold">FREE</span> : "₹79"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
              <span>Total Payable</span>
              <span className="text-xl font-black text-foreground">₹{estimatedTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="pt-2 text-2xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              <span>Prices verified against database snapshots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-primary" />
              <span>Free shipping automatically applied on orders over ₹999</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
