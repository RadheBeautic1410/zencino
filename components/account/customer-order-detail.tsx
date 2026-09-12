"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Package,
  Printer,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface OrderDetailItem {
  id: string;
  productName: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

interface OrderDetailAddress {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postcode: string;
  countryCode?: string;
}

interface CustomerOrderDetailProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalMinor: number;
    currency: string;
    trackingCourier?: string | null;
    trackingNumber?: string | null;
    createdAt: Date;
    customerEmail: string;
    customerPhone: string;
  };
  items: OrderDetailItem[];
  address: OrderDetailAddress | null;
  proof: {
    upiReference?: string | null;
    status?: string;
  } | null;
}

export function CustomerOrderDetail({
  order,
  items,
  address,
  proof,
}: CustomerOrderDetailProps) {
  const steps = [
    {
      label: "Order Placed",
      description: "Direct order created",
      completed: true,
      current: order.status === "pending_payment",
    },
    {
      label: "Payment Verified",
      description:
        order.paymentStatus === "verified"
          ? "Bank transfer confirmed"
          : order.paymentStatus === "under_review"
          ? "Verification in progress"
          : "Payment pending",
      completed: order.paymentStatus === "verified",
      current: order.status === "payment_review" || order.paymentStatus === "under_review",
    },
    {
      label: "Processing & Packaging",
      description: "Optical acrylic QA check & packing",
      completed:
        order.status === "processing" ||
        order.status === "shipped" ||
        order.status === "delivered",
      current: order.status === "processing",
    },
    {
      label: "Dispatched",
      description: order.trackingNumber
        ? `${order.trackingCourier || "Courier"}: ${order.trackingNumber}`
        : "Courier assignment",
      completed: order.status === "shipped" || order.status === "delivered",
      current: order.status === "shipped",
    },
    {
      label: "Delivered",
      description: "Delivered to recipient address",
      completed: order.status === "delivered",
      current: order.status === "delivered",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top back button and action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/account">
            <ArrowLeft size={16} /> Back to My Account
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link
              href={`/orders/${order.orderNumber}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer size={15} /> Print Tax Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-5 gap-3">
          <div>
            <span className="text-2xs font-bold uppercase tracking-ui text-muted-foreground block">
              Order Reference
            </span>
            <h1 className="font-mono text-2xl font-black text-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                order.status === "confirmed" || order.status === "delivered"
                  ? "secondary"
                  : order.status === "cancelled"
                  ? "destructive"
                  : "outline"
              }
              className="text-2xs uppercase tracking-ui font-bold"
            >
              Status: {order.status.replace("_", " ")}
            </Badge>

            <Badge
              variant={order.paymentStatus === "verified" ? "secondary" : "outline"}
              className="text-2xs uppercase tracking-ui font-bold"
            >
              Payment: {order.paymentStatus.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Visual Delivery Milestones Timeline */}
        <div className="pt-2">
          <h2 className="text-xs font-bold uppercase tracking-ui text-muted-foreground mb-6">
            Delivery Milestones
          </h2>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {steps.map((step, idx) => {
              const isDone = step.completed;
              const isCurrent = step.current;

              return (
                <div key={idx} className="relative flex items-start gap-4">
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
                        isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-2xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier Tracking Highlight */}
        {order.trackingNumber && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-primary block">
                Dispatched via {order.trackingCourier || "Courier Partner"}
              </span>
              <span className="text-2xs text-muted-foreground">
                AWB / Consignment: <strong className="font-mono text-foreground">{order.trackingNumber}</strong>
              </span>
            </div>
            <Button asChild variant="secondary" size="sm" className="h-8 text-xs">
              <Link href={`/track-order?orderNumber=${order.orderNumber}&contact=${encodeURIComponent(order.customerEmail)}`}>
                Open Public Tracking
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Package Contents & Destination Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Package Contents */}
        <div className="md:col-span-7 rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-ui flex items-center gap-1.5 text-foreground">
            <Package size={16} /> Package Contents ({items.length})
          </h2>

          <div className="divide-y divide-border">
            {items.map((it) => (
              <div key={it.id} className="py-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-foreground">{it.productName}</p>
                  <p className="text-2xs text-muted-foreground">
                    Variant: {it.variantTitle} · SKU: <span className="font-mono">{it.sku}</span>
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    Qty: {it.quantity} × ₹{(it.unitPriceMinor / 100).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right font-mono font-bold text-foreground">
                  ₹{(it.lineTotalMinor / 100).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Item Subtotal:</span>
              <span className="font-mono">₹{(items.reduce((s, i) => s + i.lineTotalMinor, 0) / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Standard Delivery:</span>
              <span>
                {order.totalMinor >= items.reduce((s, i) => s + i.lineTotalMinor, 0) + 100
                  ? `₹${((order.totalMinor - items.reduce((s, i) => s + i.lineTotalMinor, 0)) / 100).toFixed(2)}`
                  : "FREE"}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-foreground border-t border-border pt-2">
              <span>Total Paid:</span>
              <span className="font-mono">₹{(order.totalMinor / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Delivery Destination & Payment details */}
        <div className="md:col-span-5 space-y-6">
          {/* Destination */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs shadow-sm">
            <h2 className="font-bold uppercase tracking-ui flex items-center gap-1.5 text-foreground">
              <Truck size={16} /> Delivery Address
            </h2>

            {address ? (
              <div className="space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground text-sm">{address.recipient}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} — <strong className="font-mono text-foreground">{address.postcode}</strong>
                </p>
                <p className="pt-2">
                  <span className="text-2xs uppercase tracking-ui font-semibold text-muted-foreground">Phone:</span>{" "}
                  <span className="font-mono text-foreground">{address.phone}</span>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No address recorded for this order.</p>
            )}
          </div>

          {/* Payment Particulars */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs shadow-sm">
            <h2 className="font-bold uppercase tracking-ui flex items-center gap-1.5 text-foreground">
              <ShieldCheck size={16} /> Payment Particulars
            </h2>

            <div className="space-y-2 text-2xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <strong className="text-foreground uppercase">
                  {order.paymentMethod === "upi_qr" ? "Direct UPI (NPCI QR)" : order.paymentMethod}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className="font-bold text-foreground uppercase">{order.paymentStatus}</span>
              </div>
              {proof?.upiReference && (
                <div className="flex justify-between">
                  <span>Bank UTR:</span>
                  <span className="font-mono font-bold text-foreground">{proof.upiReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
