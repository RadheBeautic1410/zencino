"use client";

import {
  Check,
  MagnifyingGlass,
  Package,
  Printer,
  SpinnerGap,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  type TrackOrderResult,
  trackOrderAction,
} from "@/app/actions/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

interface OrderTrackingViewProps {
  initialContact?: string;
  initialOrderNumber?: string;
}

export function OrderTrackingView({
  initialOrderNumber = "",
  initialContact = "",
}: OrderTrackingViewProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState(initialContact);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<TrackOrderResult["data"] | null>(
    null
  );

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setError("Please provide both your Order Reference and Contact details.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await trackOrderAction(orderNumber.trim(), contact.trim());
      if (res.error) {
        setError(res.error);
        setOrderData(null);
      } else if (res.data) {
        setOrderData(res.data);
      }
    });
  };

  // Compute status timeline steps
  const steps = [
    {
      label: "Order Placed",
      description: "Direct order created",
      completed: true,
      current: orderData?.order.status === "pending_payment",
    },
    {
      label: "Payment Verified",
      description:
        orderData?.order.paymentStatus === "verified"
          ? "Bank transfer confirmed"
          : orderData?.order.paymentStatus === "under_review"
            ? "Verification in progress"
            : "Payment pending",
      completed: orderData?.order.paymentStatus === "verified",
      current:
        orderData?.order.status === "payment_review" ||
        orderData?.order.paymentStatus === "under_review",
    },
    {
      label: "Processing & Packaging",
      description: "Optical acrylic QA check & packing",
      completed:
        orderData?.order.status === "processing" ||
        orderData?.order.status === "shipped" ||
        orderData?.order.status === "delivered",
      current: orderData?.order.status === "processing",
    },
    {
      label: "Dispatched",
      description: orderData?.order.trackingNumber
        ? `${orderData.order.trackingCourier || "Courier"}: ${orderData.order.trackingNumber}`
        : "Courier assignment",
      completed:
        orderData?.order.status === "shipped" ||
        orderData?.order.status === "delivered",
      current: orderData?.order.status === "shipped",
    },
    {
      label: "Delivered",
      description: "Delivered to recipient address",
      completed: orderData?.order.status === "delivered",
      current: orderData?.order.status === "delivered",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <Truck size={28} weight="bold" />
        </div>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          Track Your Order
        </h1>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Enter your Order Reference and contact email or phone to check live
          delivery milestones and courier AWB.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-4 mb-10"
        onSubmit={handleTrackOrder}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1.5"
              htmlFor="order-tracking-view-order-number"
            >
              Order Number <span className="text-destructive">*</span>
            </label>
            <Input
              className="font-mono text-xs"
              id="order-tracking-view-order-number"
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. ZNC-20260912-A1B2"
              required
              type="text"
              value={orderNumber}
            />
          </div>

          <div>
            <label
              className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1.5"
              htmlFor="order-tracking-view-email-address-or-phone"
            >
              Email Address or Phone Number{" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              className="text-xs"
              id="order-tracking-view-email-address-or-phone"
              onChange={(e) => setContact(e.target.value)}
              placeholder="name@example.com or 9876543210"
              required
              type="text"
              value={contact}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            <WarningCircle className="shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        <Button
          className="w-full h-11 text-xs font-bold uppercase tracking-ui"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <SpinnerGap className="animate-spin" size={16} /> Searching
              Orders...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <MagnifyingGlass size={16} /> Track Shipment Status
            </span>
          )}
        </Button>
      </form>

      {/* Result Card */}
      {orderData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Summary Banner */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground block">
                  Order Reference
                </span>
                <span className="font-mono text-xl font-black text-foreground">
                  {orderData.order.orderNumber}
                </span>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Placed on {formatDateTime(orderData.order.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  className="h-8 text-xs"
                  size="sm"
                  variant="outline"
                >
                  <Link
                    href={`/orders/${orderData.order.orderNumber}/invoice?contact=${encodeURIComponent(contact.trim())}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Printer className="mr-1.5" size={14} />
                    <span>Print Tax Invoice</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Visual Tracking Progress Timeline */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-ui text-muted-foreground mb-6">
                Delivery Timeline
              </h3>

              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {steps.map((step, idx) => {
                  const isDone = step.completed;
                  const isCurrent = step.current;

                  return (
                    <div
                      className="relative flex items-start gap-4"
                      key={step.label}
                    >
                      {/* Step Marker */}
                      <span
                        className={`absolute -left-6 grid size-5 place-items-center rounded-full text-2xs font-bold ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                              ? "border-2 border-primary bg-background text-primary"
                              : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check size={12} weight="bold" /> : idx + 1}
                      </span>

                      <div>
                        <p
                          className={`text-xs font-bold ${
                            isDone || isCurrent
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-2xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier Tracking Highlight */}
            {orderData.order.trackingNumber && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-primary block">
                    Shipment Dispatched via{" "}
                    {orderData.order.trackingCourier || "Courier Partner"}
                  </span>
                  <span className="text-2xs text-muted-foreground">
                    AWB / Waybill:{" "}
                    <strong className="font-mono text-foreground">
                      {orderData.order.trackingNumber}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items & Address */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Ordered Items */}
            <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-ui flex items-center gap-1.5">
                <Package size={16} /> Package Contents ({orderData.items.length}
                )
              </h3>

              <div className="divide-y divide-border">
                {orderData.items.map((it) => (
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
            </div>

            {/* Delivery Destination */}
            <div className="md:col-span-5 rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-ui flex items-center gap-1.5">
                <Truck size={16} /> Delivery Destination
              </h3>

              {orderData.address && (
                <div className="space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {orderData.address.recipient}
                  </p>
                  <p>{orderData.address.line1}</p>
                  {orderData.address.line2 && <p>{orderData.address.line2}</p>}
                  <p>
                    {orderData.address.city}, {orderData.address.state} —{" "}
                    {orderData.address.postcode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
