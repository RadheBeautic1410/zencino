"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface OrderSuccessProps {
  address: {
    recipient: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postcode: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }>;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subtotalMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: Date;
  };
  proof: {
    upiReference: string;
    screenshotUrl: string;
    status: string;
  } | null;
}

export function OrderSuccessView({
  order,
  items,
  address,
  proof,
}: OrderSuccessProps) {
  const isUnderReview =
    order.status === "payment_review" || order.paymentStatus === "under_review";
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      {/* Top Banner */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          {isUnderReview ? (
            <Clock size={32} weight="bold" />
          ) : (
            <CheckCircle size={32} weight="fill" />
          )}
        </div>

        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          {isUnderReview
            ? "Payment Received & Under Review"
            : "Order Confirmed!"}
        </h1>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          {isUnderReview ? (
            <>
              Thank you for ordering with Zencino! We have received your UPI
              transfer proof (UTR:{" "}
              <strong className="font-mono text-foreground">
                {proof?.upiReference}
              </strong>
              ). Our operations team verifies bank transactions within{" "}
              <strong>15–30 minutes</strong> during business hours.
            </>
          ) : (
            <>
              Your order{" "}
              <strong className="text-foreground">{order.orderNumber}</strong>{" "}
              has been confirmed and is being prepped for shipment.
            </>
          )}
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold">
          <span className="text-muted-foreground">Order Reference:</span>
          <span className="font-mono font-bold text-foreground">
            {order.orderNumber}
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Order Details & Items */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
              <Package size={16} /> Items Ordered (
              {items.reduce((acc, it) => acc + it.quantity, 0)})
            </h2>

            <div className="divide-y divide-border">
              {items.map((it) => (
                <div
                  className="py-3 flex justify-between items-center text-xs"
                  key={it.id}
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {it.productName}
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      {it.variantTitle} · SKU: {it.sku} · Qty: {it.quantity}
                    </p>
                  </div>
                  <div className="text-right font-bold text-foreground">
                    ₹{(it.lineTotalMinor / 100).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Summary */}
            <div className="border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  ₹{(order.subtotalMinor / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Standard Delivery</span>
                <span className="font-semibold text-foreground">
                  {order.shippingMinor === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      FREE
                    </span>
                  ) : (
                    `₹${(order.shippingMinor / 100).toLocaleString("en-IN")}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-2xs text-muted-foreground">
                <span>Inclusive 18% GST</span>
                <span>₹{(order.taxMinor / 100).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                <span>Total Paid</span>
                <span className="text-lg font-black text-foreground">
                  ₹{(order.totalMinor / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proof summary */}
          {proof && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
                <ShieldCheck size={16} /> UPI Payment Verification Proof
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">
                    Transaction UTR
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {proof.upiReference}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground uppercase block">
                    Status
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {proof.status === "verified"
                      ? "Verified & Approved"
                      : "Under Review"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Address & Next Steps */}
        <div className="md:col-span-5 space-y-6">
          {address && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
              <h2 className="font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
                <Truck size={16} /> Delivery Address
              </h2>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {address.recipient}
                </p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} — {address.postcode}
                </p>
                <p className="pt-1">Phone: {address.phone}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-ui">
              What happens next?
            </h3>
            <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-2">
              <li>
                Our team reconciles the payment against our merchant account.
              </li>
              <li>
                You will receive an automated email confirmation to{" "}
                <strong className="text-foreground">
                  {order.customerEmail}
                </strong>
                .
              </li>
              <li>
                Your items are packed in cushioned optical-grade packaging and
                dispatched.
              </li>
            </ol>

            <div className="pt-3 flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/products">
                  <span>Continue Shopping</span>
                  <ArrowRight className="ml-1.5" size={14} />
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/account">View in My Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
