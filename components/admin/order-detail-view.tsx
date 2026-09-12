"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  MagnifyingGlassPlus,
  Package,
  ShieldCheck,
  SpinnerGap,
  Truck,
  Warning,
  X,
} from "@phosphor-icons/react";
import {
  rejectPaymentAction,
  updateOrderFulfillmentAction,
  verifyPaymentAction,
} from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

export interface AdminOrderDetailProps {
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
    cancelReason?: string | null;
    trackingCourier?: string | null;
    trackingNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  items: Array<{
    id: string;
    productName: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }>;
  address: {
    recipient: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postcode: string;
    countryCode: string;
  } | null;
  proof: {
    id: string;
    method: string;
    amountMinor: number;
    upiReference: string;
    screenshotUrl: string;
    status: string;
    reviewedBy?: string | null;
    reviewedAt?: Date | null;
    reviewNote?: string | null;
    createdAt: Date;
  } | null;
}

export function OrderDetailView({ order, items, address, proof }: AdminOrderDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Lightbox modal for payment screenshot
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fulfilment form state
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.status);
  const [trackingCourier, setTrackingCourier] = useState(order.trackingCourier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [copiedUtr, setCopiedUtr] = useState(false);

  const isUnderReview = order.status === "payment_review" || order.paymentStatus === "under_review";
  const isVerified = order.paymentStatus === "verified";

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const handleApprovePayment = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await verifyPaymentAction(order.id, "Verified by administrator");
      if (res.error) {
        setActionError(res.error);
      }
    });
  };

  const handleRejectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await rejectPaymentAction(order.id, rejectReason.trim());
      if (res.error) {
        setActionError(res.error);
      } else {
        setRejectModalOpen(false);
      }
    });
  };

  const handleUpdateFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    startTransition(async () => {
      const res = await updateOrderFulfillmentAction(
        order.id,
        fulfillmentStatus as any,
        trackingCourier,
        trackingNumber
      );
      if (res.error) {
        setActionError(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={14} /> Back to Orders
            </Link>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-3">
            <span>{order.orderNumber}</span>
            <Badge
              variant={
                order.status === "confirmed" || order.status === "delivered"
                  ? "secondary"
                  : order.status === "cancelled"
                  ? "destructive"
                  : "outline"
              }
              className="text-xs uppercase"
            >
              {order.status.replace("_", " ")}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on {formatDateTime(order.createdAt)} · Method:{" "}
            <strong className="uppercase font-semibold text-foreground">
              {order.paymentMethod === "upi_qr" ? "Direct UPI Transfer" : order.paymentMethod}
            </strong>
          </p>
        </div>

        {/* Quick Review Status */}
        {isUnderReview && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(true)}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10"
            >
              Reject Proof
            </Button>
            <Button
              size="sm"
              onClick={handleApprovePayment}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <SpinnerGap className="animate-spin" size={14} /> Approving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={16} weight="bold" /> Approve & Confirm Payment
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-xs font-semibold text-destructive">
          <Warning size={18} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Payment Proof Review & Order Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Payment Verification Card */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <CardTitle className="text-base font-bold">UPI Payment Verification</CardTitle>
                </div>
                <Badge
                  variant={isVerified ? "secondary" : isUnderReview ? "outline" : "destructive"}
                  className="text-2xs uppercase"
                >
                  {isVerified ? "Payment Verified" : isUnderReview ? "Verification Required" : order.paymentStatus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {proof ? (
                <div className="grid gap-6 sm:grid-cols-12">
                  {/* Proof Details */}
                  <div className="sm:col-span-7 space-y-4">
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground block mb-1">
                        Customer Submitted UTR / Ref No.
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-foreground">
                          {proof.upiReference}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUtr(proof.upiReference)}
                          className="flex items-center gap-1 rounded bg-background border px-2 py-1 text-2xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedUtr ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          <span>{copiedUtr ? "Copied" : "Copy UTR"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-2xs text-muted-foreground uppercase block">Expected Amount</span>
                        <span className="font-bold text-base text-foreground">
                          ₹{(order.totalMinor / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-2xs text-muted-foreground uppercase block">Proof Submitted At</span>
                        <span className="font-medium text-foreground">
                          {formatDateTime(proof.createdAt)}
                        </span>
                      </div>
                    </div>

                    {proof.reviewNote && (
                      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                        <span className="font-semibold block text-2xs uppercase text-muted-foreground mb-0.5">
                          Admin Review Note:
                        </span>
                        <p className="text-muted-foreground">{proof.reviewNote}</p>
                      </div>
                    )}

                    {isUnderReview && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={handleApprovePayment}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          ✓ Confirm Bank Credit & Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectModalOpen(true)}
                          disabled={isPending}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          Reject Proof
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Screenshot Thumbnail */}
                  <div className="sm:col-span-5 flex flex-col items-center">
                    <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1 self-start">
                      Payment Screenshot
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="group relative size-48 overflow-hidden rounded-xl border border-border bg-muted/50 transition-all hover:ring-2 hover:ring-primary"
                    >
                      <Image
                        src={proof.screenshotUrl}
                        alt="Payment Screenshot"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1.5">
                        <MagnifyingGlassPlus size={18} />
                        <span>Click to Enlarge</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No payment proof uploaded yet. Customer is currently on the payment step.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package size={18} /> Ordered Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{it.productName}</p>
                      <p className="text-2xs text-muted-foreground">
                        {it.variantTitle} · SKU: <span className="font-mono">{it.sku}</span> · Qty: {it.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ₹{(it.lineTotalMinor / 100).toLocaleString("en-IN")}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        ₹{(it.unitPriceMinor / 100).toLocaleString("en-IN")} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-border bg-muted/20 p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    ₹{(order.subtotalMinor / 100).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-semibold text-foreground">
                    {order.shippingMinor === 0 ? "FREE" : `₹${(order.shippingMinor / 100).toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="flex justify-between text-2xs text-muted-foreground">
                  <span>Inclusive 18% GST</span>
                  <span>₹{(order.taxMinor / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                  <span>Total Payable</span>
                  <span className="text-lg font-black text-foreground">
                    ₹{(order.totalMinor / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Details & Fulfillment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer & Address Card */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-ui">
                Customer & Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div>
                <span className="text-2xs uppercase text-muted-foreground font-semibold block">Contact</span>
                <p className="font-bold text-foreground">{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerEmail}</p>
                <p className="text-muted-foreground">{order.customerPhone}</p>
              </div>

              {address && (
                <div className="border-t border-border pt-3">
                  <span className="text-2xs uppercase text-muted-foreground font-semibold block mb-1">
                    Shipping Address
                  </span>
                  <p className="font-medium text-foreground">{address.recipient}</p>
                  <p className="text-muted-foreground">{address.line1}</p>
                  {address.line2 && <p className="text-muted-foreground">{address.line2}</p>}
                  <p className="text-muted-foreground">
                    {address.city}, {address.state} — {address.postcode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fulfillment Status Management */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-ui flex items-center gap-1.5">
                <Truck size={16} /> Dispatch & Fulfilment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleUpdateFulfillment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Order Status
                  </label>
                  <select
                    value={fulfillmentStatus}
                    onChange={(e) => setFulfillmentStatus(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_review">Payment Review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing / Packing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Courier Partner
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Delhivery, Blue Dart, DTDC"
                    value={trackingCourier}
                    onChange={(e) => setTrackingCourier(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    AWB / Tracking Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 14209581295"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="w-full font-bold uppercase tracking-ui"
                >
                  {isPending ? "Saving..." : "Save Fulfilment Updates"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Screenshot Lightbox Modal */}
      {lightboxOpen && proof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-black">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X size={20} />
            </button>
            <div className="relative h-[80vh] w-[80vw] max-w-3xl">
              <Image
                src={proof.screenshotUrl}
                alt="Enlarged Payment Proof"
                fill
                className="object-contain"
                sizes="80vw"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold tracking-tight">Reject Payment Proof</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Please enter the reason for rejecting this payment proof. The reserved stock will be released back to inventory.
            </p>

            <form onSubmit={handleRejectPayment} className="space-y-4 mt-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-ui text-muted-foreground mb-1">
                  Rejection Reason <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. UTR not found in bank statement, Incorrect transfer amount"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                >
                  {isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
