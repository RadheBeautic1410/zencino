"use client";

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
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
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
  cancellations?: Array<{
    id: string;
    reason: string;
    status: string;
    requestedBy: string;
    adminNote?: string | null;
    createdAt: Date;
  }>;
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
    cancelReason?: string | null;
    trackingCourier?: string | null;
    trackingNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
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
  returns?: Array<{
    id: string;
    returnNumber: string;
    orderItemId: string;
    quantity: number;
    reason: string;
    customerNote?: string | null;
    photos?: string[] | null;
    status: string;
    restockAction: string;
    refundAmountMinor: number;
    adminNote?: string | null;
    createdAt: Date;
    productName?: string | null;
    variantTitle?: string | null;
    sku?: string | null;
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
  const [trackingCourier, setTrackingCourier] = useState(
    order.trackingCourier || "Delhivery"
  );
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber || ""
  );
  const [copiedUtr, setCopiedUtr] = useState(false);

  // Inspection modal state
  const [inspectModalReturnId, setInspectModalReturnId] = useState<
    string | null
  >(null);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReturnId, setRefundReturnId] = useState<string | null>(null);
  const [refundAmountRupees, setRefundAmountRupees] = useState(
    (order.totalMinor / 100).toString()
  );
  const [refundUtr, setRefundUtr] = useState("");
  const [refundReason, setRefundReason] = useState(
    "Sales Return & Replacement Settlement"
  );

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
    if (!proof) {
      return;
    }
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
    if (!proof || !rejectReason.trim()) {
      return;
    }
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
    if (
      !canTransitionOrderStatus(
        order.status,
        fulfillmentStatus,
        order.paymentStatus
      )
    ) {
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
      if (res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleRejectCancellation = (cancellationId: string) => {
    // biome-ignore lint/suspicious/noAlert: native prompt kept until a shared dialog component exists.
    const reason = prompt("Enter reason for rejecting cancellation:");
    if (!reason?.trim()) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await rejectCancellationAction(cancellationId, reason.trim());
      if (res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleReviewReturn = (
    returnId: string,
    status: "approved" | "rejected"
  ) => {
    setActionError(null);
    startTransition(async () => {
      const res = await reviewReturnAction(returnId, status);
      if (res.error) {
        setActionError(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleInspectReturn = (action: "restocked" | "scrapped") => {
    if (!inspectModalReturnId) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const res = await inspectReturnAction(inspectModalReturnId, action);
      if (res.error) {
        setActionError(res.error);
      } else {
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
    if (refundReturnId) {
      formData.append("returnId", refundReturnId);
    }
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
          <Button
            asChild
            className="mb-2 h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <Link href="/admin/orders">
              <ArrowLeft size={14} /> Back to Orders
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-black">
              {order.orderNumber}
            </h1>
            <Badge
              className="text-xs uppercase"
              variant={
                order.status === "confirmed" || order.status === "delivered"
                  ? "secondary"
                  : order.status === "cancelled"
                    ? "destructive"
                    : "outline"
              }
            >
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Placed on {formatDateTime(order.createdAt)} · Total: ₹
            {(order.totalMinor / 100).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="h-8 gap-1.5 text-xs"
            size="sm"
            variant="outline"
          >
            <Link href={`/orders/${order.orderNumber}/invoice`} target="_blank">
              <Printer size={15} /> Print Tax Invoice
            </Link>
          </Button>

          {refunds.length > 0 && (
            <Button
              asChild
              className="h-8 gap-1.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              size="sm"
              variant="outline"
            >
              <Link
                href={`/orders/${order.orderNumber}/credit-note`}
                target="_blank"
              >
                <FileText size={15} /> GST Credit Note
              </Link>
            </Button>
          )}

          <Button
            className="h-8 text-xs font-bold uppercase tracking-ui"
            onClick={() => {
              setRefundReturnId(null);
              setRefundModalOpen(true);
            }}
            size="sm"
            variant="outline"
          >
            Issue Refund
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-xs text-destructive">
          <WarningCircle className="shrink-0" size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Verification, Returns, Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Payment Proof Card */}
          {proof && (
            <Card
              className={
                isUnderReview
                  ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-ui flex items-center gap-2">
                    <ShieldCheck
                      className={
                        isUnderReview ? "text-amber-500" : "text-primary"
                      }
                      size={18}
                    />
                    Payment Verification
                  </CardTitle>
                  <Badge
                    className="text-2xs uppercase"
                    variant={
                      proof.status === "verified"
                        ? "secondary"
                        : proof.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
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
                        className="ml-auto text-muted-foreground hover:text-foreground p-1"
                        onClick={handleCopyUtr}
                        title="Copy UTR"
                        type="button"
                      >
                        {copiedUtr ? (
                          <Check className="text-emerald-500" size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
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
                    <button
                      className="group relative h-48 w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-black/5 hover:border-primary/50 transition-all"
                      onClick={() => setLightboxUrl(proof.screenshotUrl)}
                      type="button"
                    >
                      <Image
                        alt="Screenshot"
                        className="object-contain transition-transform group-hover:scale-102"
                        fill
                        src={proof.screenshotUrl}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase tracking-ui transition-opacity">
                        <MagnifyingGlassPlus className="mr-1.5" size={20} />{" "}
                        Full Size
                      </div>
                    </button>
                  </div>
                )}

                {isUnderReview && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button
                      className="gap-1.5 text-xs font-bold uppercase tracking-ui bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isPending}
                      onClick={handleVerifyPayment}
                    >
                      {isPending ? (
                        <SpinnerGap className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve & Confirm Order
                    </Button>
                    <Button
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={isPending}
                      onClick={() => setRejectModalOpen(true)}
                      variant="outline"
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
                  <Warning size={18} /> Cancellation Requests (
                  {cancellations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cancellations.map((c) => (
                  <div
                    className="rounded-xl border border-border bg-card p-4 text-xs space-y-2"
                    key={c.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        Requested by {c.requestedBy}
                      </span>
                      <Badge
                        className="text-3xs uppercase"
                        variant={
                          c.status === "approved" ? "secondary" : "outline"
                        }
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{c.reason}</p>
                    {c.status === "requested" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button
                          className="h-7 text-3xs font-bold uppercase bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isPending}
                          onClick={() => handleApproveCancellation(c.id)}
                          size="sm"
                        >
                          Approve & Restore Stock
                        </Button>
                        <Button
                          className="h-7 text-3xs"
                          disabled={isPending}
                          onClick={() => handleRejectCancellation(c.id)}
                          size="sm"
                          variant="outline"
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
                    <Package size={18} /> Customer Return Claims (
                    {returns.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {returns.map((ret) => (
                  <div
                    className="rounded-xl border border-border bg-card p-4 text-xs space-y-3"
                    key={ret.id}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                      <div>
                        <span className="font-mono font-bold text-foreground">
                          {ret.returnNumber}
                        </span>
                        <p className="text-2xs text-muted-foreground">
                          {ret.quantity}x {ret.productName || "Item"} (
                          {ret.variantTitle || ""})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-3xs uppercase" variant="outline">
                          Status: {ret.status}
                        </Badge>
                        {ret.restockAction !== "none" && (
                          <Badge
                            className="text-3xs uppercase bg-primary/10 text-primary"
                            variant="secondary"
                          >
                            Stock: {ret.restockAction}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-2xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Reason:</strong>{" "}
                        {ret.reason.replace(/_/g, " ")}
                      </p>
                      {ret.customerNote && (
                        <p>
                          <strong className="text-foreground">
                            Customer Note:
                          </strong>{" "}
                          {ret.customerNote}
                        </p>
                      )}
                    </div>

                    {/* Photos Preview */}
                    {ret.photos &&
                      Array.isArray(ret.photos) &&
                      ret.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ret.photos.map((pUrl) => (
                            <button
                              className="relative size-14 rounded border border-border overflow-hidden cursor-pointer hover:opacity-80"
                              key={pUrl}
                              onClick={() => setLightboxUrl(pUrl)}
                              type="button"
                            >
                              <Image
                                alt="Return proof"
                                className="object-cover"
                                fill
                                src={pUrl}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Operator Return Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                      {ret.status === "requested" && (
                        <>
                          <Button
                            className="h-7 text-3xs font-bold uppercase tracking-ui"
                            disabled={isPending}
                            onClick={() =>
                              handleReviewReturn(ret.id, "approved")
                            }
                            size="sm"
                          >
                            Approve Claim
                          </Button>
                          <Button
                            className="h-7 text-3xs text-destructive border-destructive/30"
                            disabled={isPending}
                            onClick={() =>
                              handleReviewReturn(ret.id, "rejected")
                            }
                            size="sm"
                            variant="outline"
                          >
                            Reject Claim
                          </Button>
                        </>
                      )}

                      {ret.status === "approved" &&
                        ret.restockAction === "none" && (
                          <Button
                            className="h-7 text-3xs font-bold uppercase tracking-ui bg-primary"
                            disabled={isPending}
                            onClick={() => setInspectModalReturnId(ret.id)}
                            size="sm"
                          >
                            Confirm Package Arrival & Inspect
                          </Button>
                        )}

                      {ret.status === "received" && (
                        <Button
                          className="h-7 text-3xs font-bold uppercase tracking-ui"
                          disabled={isPending}
                          onClick={() => {
                            setRefundReturnId(ret.id);
                            setRefundAmountRupees(
                              (ret.refundAmountMinor / 100).toString()
                            );
                            setRefundModalOpen(true);
                          }}
                          size="sm"
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
                  <div
                    className="py-3 flex justify-between items-center text-xs"
                    key={it.id}
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {it.productName}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        Variant: {it.variantTitle} · SKU:{" "}
                        <span className="font-mono">{it.sku}</span>
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        Qty: {it.quantity} × ₹
                        {(it.unitPriceMinor / 100).toLocaleString("en-IN")}
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
                  <FileText size={18} /> Issued Refunds & GST Credit Notes (
                  {refunds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {refunds.map((r) => (
                  <div
                    className="rounded-xl border border-rose-200 bg-white p-4 text-xs space-y-2"
                    key={r.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-700">
                        {r.creditNoteNumber}
                      </span>
                      <span className="font-bold text-foreground">
                        ₹{(r.amountMinor / 100).toLocaleString("en-IN")} INR
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground space-y-0.5">
                      <p>
                        Refund Ref:{" "}
                        <span className="font-mono">{r.refundNumber}</span>
                      </p>
                      <p>
                        Bank Reversal UTR:{" "}
                        <span className="font-mono text-foreground font-semibold">
                          {r.transactionReference}
                        </span>
                      </p>
                      <p>Reason: {r.reason}</p>
                      <p>Processed: {formatDateTime(r.processedAt)}</p>
                    </div>
                    <div className="pt-2 border-t border-rose-100 flex justify-end">
                      <Button
                        asChild
                        className="h-7 text-xs text-rose-700"
                        size="sm"
                        variant="outline"
                      >
                        <Link
                          href={`/orders/${order.orderNumber}/credit-note?creditNote=${r.creditNoteNumber}`}
                          target="_blank"
                        >
                          <Printer className="mr-1" size={13} /> View / Print
                          Credit Note
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
              <form
                className="space-y-4 text-xs"
                onSubmit={handleUpdateFulfillment}
              >
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="order-detail-view-order-status"
                  >
                    Order Status
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    id="order-detail-view-order-status"
                    onChange={(e) => setFulfillmentStatus(e.target.value)}
                    value={fulfillmentStatus}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing & Packaging</option>
                    <option value="shipped">Shipped (Dispatched)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="order-detail-view-courier-partner"
                  >
                    Courier Partner
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                    id="order-detail-view-courier-partner"
                    onChange={(e) => setTrackingCourier(e.target.value)}
                    value={trackingCourier}
                  >
                    {COMMON_COURIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="order-detail-view-consignment-awb-tracking-no"
                  >
                    Consignment / AWB Tracking No.
                  </label>
                  <Input
                    className="text-xs font-mono"
                    id="order-detail-view-consignment-awb-tracking-no"
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 1234567890"
                    value={trackingNumber}
                  />
                </div>

                <Button
                  className="w-full text-xs font-bold uppercase tracking-ui"
                  disabled={isPending}
                  size="sm"
                  type="submit"
                >
                  {isPending && (
                    <SpinnerGap className="animate-spin mr-1" size={14} />
                  )}{" "}
                  Update Fulfilment
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
                  <p className="font-semibold text-foreground">
                    {address.recipient}
                  </p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} —{" "}
                    <strong className="font-mono text-foreground">
                      {address.postcode}
                    </strong>
                  </p>
                  <p className="pt-2">
                    <span className="text-2xs uppercase tracking-ui font-semibold">
                      Phone:
                    </span>{" "}
                    <span className="font-mono text-foreground">
                      {address.phone}
                    </span>
                  </p>
                  <p>
                    <span className="text-2xs uppercase tracking-ui font-semibold">
                      Email:
                    </span>{" "}
                    <span className="text-foreground">
                      {order.customerEmail}
                    </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <button
            aria-label="Close image preview"
            className="absolute inset-0 size-full cursor-default"
            onClick={() => setLightboxUrl(null)}
            type="button"
          />
          <div className="relative z-10 max-h-[90vh] max-w-2xl w-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-neutral-300"
              onClick={() => setLightboxUrl(null)}
              type="button"
            >
              <X size={24} />
            </button>
            <div className="relative h-[80vh] w-full rounded-xl overflow-hidden bg-black">
              <Image
                alt="Inspection proof"
                className="object-contain"
                fill
                src={lightboxUrl}
              />
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
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setInspectModalReturnId(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select the QA inspection outcome. This action updates inventory
              records with audit tracing.
            </p>

            <div className="space-y-3 pt-2">
              <button
                className="w-full cursor-pointer rounded-xl border border-border hover:border-primary p-4 space-y-1 transition-colors text-left"
                onClick={() => handleInspectReturn("restocked")}
                type="button"
              >
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <CheckCircle className="text-emerald-500" size={16} /> Restock
                  as Sellable Inventory
                </span>
                <span className="block text-2xs text-muted-foreground">
                  Goods are intact and in original condition. Adds units back to
                  active warehouse sellable balance.
                </span>
              </button>

              <button
                className="w-full cursor-pointer rounded-xl border border-border hover:border-destructive p-4 space-y-1 transition-colors text-left"
                onClick={() => handleInspectReturn("scrapped")}
                type="button"
              >
                <span className="font-bold text-xs text-destructive flex items-center gap-1.5">
                  <WarningCircle size={16} /> Scrap Damaged Item
                </span>
                <span className="block text-2xs text-muted-foreground">
                  Goods are broken/scratched in transit. Will NOT add units to
                  sellable stock.
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="text-xs"
                onClick={() => setInspectModalReturnId(null)}
                size="sm"
                variant="ghost"
              >
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
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setRefundModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4 text-xs" onSubmit={handleProcessRefund}>
              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="order-detail-view-refund-amount-inr"
                >
                  Refund Amount (INR ₹){" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs font-mono"
                  id="order-detail-view-refund-amount-inr"
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={refundAmountRupees}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="order-detail-view-bank-reversal-utr-transaction"
                >
                  Bank Reversal UTR / Transaction ID{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs font-mono"
                  id="order-detail-view-bank-reversal-utr-transaction"
                  onChange={(e) => setRefundUtr(e.target.value)}
                  placeholder="e.g. 425612345678"
                  required
                  value={refundUtr}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="order-detail-view-reason-for-credit-note"
                >
                  Reason for Credit Note{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="order-detail-view-reason-for-credit-note"
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  value={refundReason}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button
                  className="text-xs"
                  onClick={() => setRefundModalOpen(false)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="gap-2 text-xs font-bold uppercase tracking-ui"
                  disabled={isPending}
                  size="sm"
                  type="submit"
                >
                  {isPending && (
                    <SpinnerGap className="animate-spin" size={14} />
                  )}{" "}
                  Confirm Refund
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
              Provide a reason. The reserved stock will be automatically
              released back to available inventory.
            </p>
            <form className="space-y-4" onSubmit={handleRejectPayment}>
              <Input
                className="text-xs"
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not reflected in merchant bank account"
                required
                value={rejectReason}
              />
              <div className="flex justify-end gap-3">
                <Button
                  className="text-xs"
                  onClick={() => setRejectModalOpen(false)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                  disabled={isPending}
                  size="sm"
                  type="submit"
                >
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
