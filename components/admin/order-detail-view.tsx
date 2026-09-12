"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  FileText,
  MagnifyingGlassPlus,
  Package,
  Printer,
  ShieldCheck,
  SpinnerGap,
  Truck,
  Warning,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { rejectPaymentAction, verifyPaymentAction } from "@/app/actions/orders";
import {
  approveCancellationAction,
  inspectReturnAction,
  processRefundAction,
  rejectCancellationAction,
  reviewReturnAction,
  updateFulfillmentAction,
} from "@/app/actions/returns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { canTransitionOrderStatus } from "@/lib/commerce/rules";
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
  returns?: Array<{
    id: string;
    returnNumber: string;
    orderItemId: string;
    quantity: number;
    reason: string;
    customerNote?: string | null;
    photos?: any;
    status: string;
    restockAction: string;
    refundAmountMinor: number;
    adminNote?: string | null;
    createdAt: Date;
    productName?: string | null;
    variantTitle?: string | null;
    sku?: string | null;
  }>;
  refunds?: Array<{
    id: string;
    refundNumber: string;
    amountMinor: number;
    reason: string;
    creditNoteNumber: string;
    transactionReference?: string | null;
    status: string;
    processedAt: Date;
  }>;
  cancellations?: Array<{
    id: string;
    reason: string;
    status: string;
    requestedBy: string;
    adminNote?: string | null;
    createdAt: Date;
  }>;
}

const COMMON_COURIERS = [
  "Delhivery",
  "Blue Dart",
  "DTDC",
  "India Post",
  "Amazon Logistics",
  "Xpressbees",
  "Shadowfax",
  "Other",
];

export function OrderDetailView({
  order,
  items,
  address,
  proof,
  returns = [],
  refunds = [],
  cancellations = [],
}: AdminOrderDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Lightbox modal for payment screenshot or return photo
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Payment proof rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fulfilment form state
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.status);
  const [trackingCourier, setTrackingCourier] = useState(order.trackingCourier || "Delhivery");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [copiedUtr, setCopiedUtr] = useState(false);

  // Inspection modal state
  const [inspectModalReturnId, setInspectModalReturnId] = useState<string | null>(null);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReturnId, setRefundReturnId] = useState<string | null>(null);
  const [refundAmountRupees, setRefundAmountRupees] = useState(
    (order.totalMinor / 100).toString()
  );
  const [refundUtr, setRefundUtr] = useState("");
  const [refundReason, setRefundReason] = useState("Sales Return & Replacement Settlement");

  const isUnderReview =
    order.status === "payment_review" || order.paymentStatus === "under_review";

  const handleCopyUtr = () => {
    if (proof?.upiReference) {
      navigator.clipboard.writeText(proof.upiReference);
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  const handleVerifyPayment = () => {
    if (!proof) return;
    setActionError(null);

    startTransition(async () => {
      const res = await verifyPaymentAction(order.id, proof.id);
      if (res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleRejectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof || !rejectReason.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const res = await rejectPaymentAction(order.id, rejectReason.trim());
      if (res.error) {
        setActionError(res.error);
      } else {
        setRejectModalOpen(false);
        window.location.reload();
      }
    });
  };

  const handleUpdateFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    // Validate transition
    if (!canTransitionOrderStatus(order.status, fulfillmentStatus, order.paymentStatus)) {
      setActionError(
        `Cannot transition order to '${fulfillmentStatus}' while payment is ${order.paymentStatus}. Unpaid orders cannot be shipped.`
      );
      return;
    }

    const formData = new FormData();
    formData.append("orderId", order.id);
    formData.append("status", fulfillmentStatus);
    formData.append("trackingCourier", trackingCourier);
    formData.append("trackingNumber", trackingNumber);

    startTransition(async () => {
      const res = await updateFulfillmentAction(formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleApproveCancellation = (cancellationId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await approveCancellationAction(cancellationId);
      if (res.error) setActionError(res.error);
      else window.location.reload();
    });
  };

  const handleRejectCancellation = (cancellationId: string) => {
    const reason = prompt("Enter reason for rejecting cancellation:");
    if (!reason?.trim()) return;

    setActionError(null);
    startTransition(async () => {
      const res = await rejectCancellationAction(cancellationId, reason.trim());
      if (res.error) setActionError(res.error);
      else window.location.reload();
    });
  };

  const handleReviewReturn = (returnId: string, status: "approved" | "rejected") => {
    setActionError(null);
    startTransition(async () => {
      const res = await reviewReturnAction(returnId, status);
      if (res.error) setActionError(res.error);
      else window.location.reload();
    });
  };

  const handleInspectReturn = (action: "restocked" | "scrapped") => {
    if (!inspectModalReturnId) return;
    setActionError(null);
    startTransition(async () => {
      const res = await inspectReturnAction(inspectModalReturnId, action);
      if (res.error) setActionError(res.error);
      else {
        setInspectModalReturnId(null);
        window.location.reload();
      }
    });
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const formData = new FormData();
    formData.append("orderId", order.id);
    if (refundReturnId) formData.append("returnId", refundReturnId);
    formData.append("amountRupees", refundAmountRupees);
    formData.append("transactionReference", refundUtr.trim());
    formData.append("reason", refundReason.trim());

    startTransition(async () => {
      const res = await processRefundAction(formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        setRefundModalOpen(false);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/admin/orders">
              <ArrowLeft size={14} /> Back to Orders
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-black">{order.orderNumber}</h1>
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
          </div>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Placed on {formatDateTime(order.createdAt)} · Total: ₹{(order.totalMinor / 100).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link href={`/orders/${order.orderNumber}/invoice`} target="_blank">
              <Printer size={15} /> Print Tax Invoice
            </Link>
          </Button>

          {refunds.length > 0 && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50">
              <Link href={`/orders/${order.orderNumber}/credit-note`} target="_blank">
                <FileText size={15} /> GST Credit Note
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefundReturnId(null);
              setRefundModalOpen(true);
            }}
            className="h-8 text-xs font-bold uppercase tracking-ui"
          >
            Issue Refund
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-xs text-destructive">
          <WarningCircle size={18} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Verification, Returns, Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Payment Proof Card */}
          {proof && (
            <Card className={isUnderReview ? "border-amber-500/40 bg-amber-500/5 shadow-sm" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                    <ShieldCheck size={18} className={isUnderReview ? "text-amber-500" : "text-primary"} />
                    Payment Verification
                  </CardTitle>
                  <Badge
                    variant={
                      proof.status === "verified"
                        ? "secondary"
                        : proof.status === "rejected"
                        ? "destructive"
                        : "outline"
                    }
                    className="text-2xs uppercase"
                  >
                    {proof.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 text-xs">
                    <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Customer Bank UTR / Reference
                    </span>
                    <div className="flex items-center gap-2 font-mono font-bold text-sm bg-muted/50 p-2.5 rounded-lg border border-border">
                      <span className="truncate">{proof.upiReference}</span>
                      <button
                        type="button"
                        onClick={handleCopyUtr}
                        className="ml-auto text-muted-foreground hover:text-foreground p-1"
                        title="Copy UTR"
                      >
                        {copiedUtr ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Expected Order Total
                    </span>
                    <div className="font-mono font-bold text-sm bg-muted/50 p-2.5 rounded-lg border border-border">
                      ₹{(proof.amountMinor / 100).toLocaleString("en-IN")} INR
                    </div>
                  </div>
                </div>

                {proof.screenshotUrl && (
                  <div className="space-y-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Payment Screenshot Proof
                    </span>
                    <div
                      onClick={() => setLightboxUrl(proof.screenshotUrl)}
                      className="group relative h-48 w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-black/5 hover:border-primary/50 transition-all"
                    >
                      <Image
                        src={proof.screenshotUrl}
                        alt="Screenshot"
                        fill
                        className="object-contain transition-transform group-hover:scale-102"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase tracking-ui transition-opacity">
                        <MagnifyingGlassPlus size={20} className="mr-1.5" /> Full Size
                      </div>
                    </div>
                  </div>
                )}

                {isUnderReview && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button
                      onClick={handleVerifyPayment}
                      disabled={isPending}
                      className="gap-1.5 text-xs font-bold uppercase tracking-ui bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isPending ? <SpinnerGap className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Approve & Confirm Order
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectModalOpen(true)}
                      disabled={isPending}
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      Reject Proof
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cancellations Section */}
          {cancellations.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-ui text-destructive flex items-center gap-2">
                  <Warning size={18} /> Cancellation Requests ({cancellations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cancellations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Requested by {c.requestedBy}</span>
                      <Badge variant={c.status === "approved" ? "secondary" : "outline"} className="text-3xs uppercase">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{c.reason}</p>
                    {c.status === "requested" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          onClick={() => handleApproveCancellation(c.id)}
                          disabled={isPending}
                          className="h-7 text-3xs font-bold uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Approve & Restore Stock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectCancellation(c.id)}
                          disabled={isPending}
                          className="h-7 text-3xs"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Customer Returns Section */}
          {returns.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                    <Package size={18} /> Customer Return Claims ({returns.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {returns.map((ret) => (
                  <div key={ret.id} className="rounded-xl border border-border bg-card p-4 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                      <div>
                        <span className="font-mono font-bold text-foreground">{ret.returnNumber}</span>
                        <p className="text-2xs text-muted-foreground">
                          {ret.quantity}x {ret.productName || "Item"} ({ret.variantTitle || ""})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-3xs uppercase">
                          Status: {ret.status}
                        </Badge>
                        {ret.restockAction !== "none" && (
                          <Badge variant="secondary" className="text-3xs uppercase bg-primary/10 text-primary">
                            Stock: {ret.restockAction}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-2xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Reason:</strong> {ret.reason.replace(/_/g, " ")}
                      </p>
                      {ret.customerNote && (
                        <p>
                          <strong className="text-foreground">Customer Note:</strong> {ret.customerNote}
                        </p>
                      )}
                    </div>

                    {/* Photos Preview */}
                    {ret.photos && Array.isArray(ret.photos) && ret.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ret.photos.map((pUrl: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxUrl(pUrl)}
                            className="relative size-14 rounded border border-border overflow-hidden cursor-pointer hover:opacity-80"
                          >
                            <Image src={pUrl} alt="Return proof" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Operator Return Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                      {ret.status === "requested" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReviewReturn(ret.id, "approved")}
                            disabled={isPending}
                            className="h-7 text-3xs font-bold uppercase tracking-ui"
                          >
                            Approve Claim
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewReturn(ret.id, "rejected")}
                            disabled={isPending}
                            className="h-7 text-3xs text-destructive border-destructive/30"
                          >
                            Reject Claim
                          </Button>
                        </>
                      )}

                      {ret.status === "approved" && ret.restockAction === "none" && (
                        <Button
                          size="sm"
                          onClick={() => setInspectModalReturnId(ret.id)}
                          disabled={isPending}
                          className="h-7 text-3xs font-bold uppercase tracking-ui bg-primary"
                        >
                          Confirm Package Arrival & Inspect
                        </Button>
                      )}

                      {ret.status === "received" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setRefundReturnId(ret.id);
                            setRefundAmountRupees((ret.refundAmountMinor / 100).toString());
                            setRefundModalOpen(true);
                          }}
                          disabled={isPending}
                          className="h-7 text-3xs font-bold uppercase tracking-ui"
                        >
                          Issue Refund & GST Credit Note
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                <Package size={18} /> Ordered Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{it.productName}</p>
                      <p className="text-2xs text-muted-foreground">
                        Variant: {it.variantTitle} · SKU: <span className="font-mono">{it.sku}</span>
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        Qty: {it.quantity} × ₹{(it.unitPriceMinor / 100).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold">
                      ₹{(it.lineTotalMinor / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Refund History & Credit Notes */}
          {refunds.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-ui text-rose-800 flex items-center gap-2">
                  <FileText size={18} /> Issued Refunds & GST Credit Notes ({refunds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {refunds.map((r) => (
                  <div key={r.id} className="rounded-xl border border-rose-200 bg-white p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-700">{r.creditNoteNumber}</span>
                      <span className="font-bold text-foreground">
                        ₹{(r.amountMinor / 100).toLocaleString("en-IN")} INR
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground space-y-0.5">
                      <p>Refund Ref: <span className="font-mono">{r.refundNumber}</span></p>
                      <p>Bank Reversal UTR: <span className="font-mono text-foreground font-semibold">{r.transactionReference}</span></p>
                      <p>Reason: {r.reason}</p>
                      <p>Processed: {formatDateTime(r.processedAt)}</p>
                    </div>
                    <div className="pt-2 border-t border-rose-100 flex justify-end">
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs text-rose-700">
                        <Link href={`/orders/${order.orderNumber}/credit-note?creditNote=${r.creditNoteNumber}`} target="_blank">
                          <Printer size={13} className="mr-1" /> View / Print Credit Note
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (4 cols): Fulfillment controls & destination */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fulfilment Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                <Truck size={18} /> Fulfilment & Carrier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateFulfillment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Order Status
                  </label>
                  <select
                    value={fulfillmentStatus}
                    onChange={(e) => setFulfillmentStatus(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing & Packaging</option>
                    <option value="shipped">Shipped (Dispatched)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Courier Partner
                  </label>
                  <select
                    value={trackingCourier}
                    onChange={(e) => setTrackingCourier(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                  >
                    {COMMON_COURIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Consignment / AWB Tracking No.
                  </label>
                  <Input
                    placeholder="e.g. 1234567890"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="w-full text-xs font-bold uppercase tracking-ui"
                >
                  {isPending && <SpinnerGap className="animate-spin mr-1" size={14} />} Update Fulfilment
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                <Truck size={18} /> Shipping Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              {address ? (
                <>
                  <p className="font-semibold text-foreground">{address.recipient}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} — <strong className="font-mono text-foreground">{address.postcode}</strong>
                  </p>
                  <p className="pt-2">
                    <span className="text-2xs uppercase tracking-ui font-semibold">Phone:</span>{" "}
                    <span className="font-mono text-foreground">{address.phone}</span>
                  </p>
                  <p>
                    <span className="text-2xs uppercase tracking-ui font-semibold">Email:</span>{" "}
                    <span className="text-foreground">{order.customerEmail}</span>
                  </p>
                </>
              ) : (
                <p>No address recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-neutral-300"
            >
              <X size={24} />
            </button>
            <div className="relative h-[80vh] w-full rounded-xl overflow-hidden bg-black">
              <Image src={lightboxUrl} alt="Inspection proof" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Return QA Inspection Modal */}
      {inspectModalReturnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
                Physical Receipt & Inspection
              </h3>
              <button onClick={() => setInspectModalReturnId(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select the QA inspection outcome. This action updates inventory records with audit tracing.
            </p>

            <div className="space-y-3 pt-2">
              <div
                onClick={() => handleInspectReturn("restocked")}
                className="cursor-pointer rounded-xl border border-border hover:border-primary p-4 space-y-1 transition-colors"
              >
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-emerald-500" /> Restock as Sellable Inventory
                </span>
                <p className="text-2xs text-muted-foreground">
                  Goods are intact and in original condition. Adds units back to active warehouse sellable balance.
                </p>
              </div>

              <div
                onClick={() => handleInspectReturn("scrapped")}
                className="cursor-pointer rounded-xl border border-border hover:border-destructive p-4 space-y-1 transition-colors"
              >
                <span className="font-bold text-xs text-destructive flex items-center gap-1.5">
                  <WarningCircle size={16} /> Scrap Damaged Item
                </span>
                <p className="text-2xs text-muted-foreground">
                  Goods are broken/scratched in transit. Will NOT add units to sellable stock.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setInspectModalReturnId(null)} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
                Issue Refund & Generate GST Credit Note
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Refund Amount (INR ₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmountRupees}
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Bank Reversal UTR / Transaction ID <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. 425612345678"
                  value={refundUtr}
                  onChange={(e) => setRefundUtr(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Reason for Credit Note <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setRefundModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} size="sm" className="gap-2 text-xs font-bold uppercase tracking-ui">
                  {isPending && <SpinnerGap className="animate-spin" size={14} />} Confirm Refund
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-ui text-destructive">
              Reject Payment Proof
            </h3>
            <p className="text-xs text-muted-foreground">
              Provide a reason. The reserved stock will be automatically released back to available inventory.
            </p>
            <form onSubmit={handleRejectPayment} className="space-y-4">
              <Input
                required
                placeholder="e.g. UTR not reflected in merchant bank account"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs">
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
