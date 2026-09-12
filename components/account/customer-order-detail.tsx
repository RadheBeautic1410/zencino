"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Package,
  Printer,
  ShieldCheck,
  SpinnerGap,
  Truck,
  UploadSimple,
  Warning,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { requestCancellationAction, requestReturnAction } from "@/app/actions/returns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isReturnEligible } from "@/lib/commerce/rules";
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

interface ReturnRecord {
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
}

interface RefundRecord {
  id: string;
  refundNumber: string;
  amountMinor: number;
  reason: string;
  creditNoteNumber: string;
  transactionReference?: string | null;
  status: string;
  processedAt: Date;
}

interface CancellationRecord {
  id: string;
  reason: string;
  status: string;
  requestedBy: string;
  adminNote?: string | null;
  createdAt: Date;
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
    cancelReason?: string | null;
    trackingCourier?: string | null;
    trackingNumber?: string | null;
    dispatchedAt?: Date | null;
    deliveredAt?: Date | null;
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
  returns?: ReturnRecord[];
  refunds?: RefundRecord[];
  cancellations?: CancellationRecord[];
}

export function CustomerOrderDetail({
  order,
  items,
  address,
  proof,
  returns = [],
  refunds = [],
  cancellations = [],
}: CustomerOrderDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Return request modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState<string>("damaged_in_transit");
  const [customerNote, setCustomerNote] = useState("");
  const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((it) => it.id === selectedItemId) || items[0];

  const eligibility = isReturnEligible(order.status, order.deliveredAt);
  const canCancel =
    order.status === "pending_payment" ||
    order.status === "payment_review" ||
    order.status === "confirmed" ||
    order.status === "processing";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/returns/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setPhotoError(data.error || "Failed to upload image.");
      } else if (data.url) {
        setReturnPhotos((prev) => [...prev, data.url]);
      }
    } catch {
      setPhotoError("Network error uploading photo proof.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setReturnPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRequestCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const formData = new FormData();
    formData.append("orderId", order.id);
    formData.append("reason", cancelReason.trim());

    startTransition(async () => {
      const res = await requestCancellationAction(formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        setCancelModalOpen(false);
        setCancelReason("");
        window.location.reload();
      }
    });
  };

  const handleRequestReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (
      (returnReason === "damaged_in_transit" || returnReason === "defective_quality") &&
      returnPhotos.length === 0
    ) {
      setActionError("Please upload at least 1 photo showing the damage or defect.");
      return;
    }

    const formData = new FormData();
    formData.append("orderId", order.id);
    formData.append("orderItemId", selectedItemId);
    formData.append("quantity", returnQuantity.toString());
    formData.append("reason", returnReason);
    formData.append("customerNote", customerNote.trim());
    formData.append("photos", JSON.stringify(returnPhotos));

    startTransition(async () => {
      const res = await requestReturnAction(formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        setReturnModalOpen(false);
        setReturnPhotos([]);
        setCustomerNote("");
        window.location.reload();
      }
    });
  };

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Invoice */}
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link
              href={`/orders/${order.orderNumber}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer size={15} /> Print Tax Invoice
            </Link>
          </Button>

          {/* Credit Note Link if refund exists */}
          {refunds.length > 0 && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-rose-700 border-rose-200 hover:bg-rose-50">
              <Link
                href={`/orders/${order.orderNumber}/credit-note`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={15} /> Print GST Credit Note
              </Link>
            </Button>
          )}

          {/* Cancel Order Trigger */}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Cancel Order
            </Button>
          )}

          {/* Return Request Trigger */}
          {order.status === "delivered" && eligibility.eligible && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReturnModalOpen(true)}
              className="h-8 text-xs font-bold uppercase tracking-ui"
            >
              Request Return / Replacement
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-xs text-destructive">
          <WarningCircle size={18} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Active Return Status Banner */}
      {returns.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase text-3xs font-bold">
                Return Claim Active
              </Badge>
              <span className="font-mono text-xs font-bold text-foreground">
                {returns[0].returnNumber}
              </span>
            </div>
            <span className="text-2xs uppercase tracking-ui font-semibold text-primary">
              Status: {returns[0].status.replace("_", " ")}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Claim for <strong>{returns[0].quantity}x {returns[0].productName}</strong> (Reason:{" "}
            {returns[0].reason.replace(/_/g, " ")}).
            {returns[0].status === "requested" &&
              " Our customer care team is reviewing your claim and photo verification."}
            {returns[0].status === "approved" &&
              " Return approved. Our courier will contact you to collect the packaged article."}
            {returns[0].status === "received" &&
              " Package received at warehouse. QA inspection completed."}
            {returns[0].status === "completed" &&
              " Return resolved. Direct refund settlement completed."}
          </p>

          {returns[0].adminNote && (
            <p className="text-2xs text-muted-foreground border-t border-primary/10 pt-2">
              <strong>Zencino Note:</strong> {returns[0].adminNote}
            </p>
          )}
        </div>
      )}

      {/* Main Order Status Card */}
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
              variant={
                order.paymentStatus === "verified"
                  ? "secondary"
                  : order.paymentStatus === "refunded"
                  ? "destructive"
                  : "outline"
              }
              className="text-2xs uppercase tracking-ui font-bold"
            >
              Payment: {order.paymentStatus.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Visual Delivery Milestones Timeline */}
        {order.status !== "cancelled" ? (
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
        ) : (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive space-y-1">
            <span className="font-bold block">Order Cancelled</span>
            <p className="text-2xs text-muted-foreground">
              {order.cancelReason || "This order was cancelled."}
            </p>
          </div>
        )}

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
              <span className="font-mono">
                ₹{(items.reduce((s, i) => s + i.lineTotalMinor, 0) / 100).toLocaleString("en-IN")}
              </span>
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

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
                Cancel Order {order.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Please specify the reason for cancelling this order. If your payment was already verified,
              a direct UPI reversal refund will be initiated by our team.
            </p>

            <form onSubmit={handleRequestCancellation} className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Reason for Cancellation <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Ordered incorrect size, change of mind"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(false)}
                  className="text-xs"
                >
                  Keep Order
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="gap-2 text-xs font-bold uppercase tracking-ui bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending && <SpinnerGap className="animate-spin" size={14} />} Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-ui text-foreground">
                Request Return / Replacement
              </h3>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-4 text-xs">
              {/* Select Item */}
              {items.length > 1 && (
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Select Item to Return <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value);
                      setReturnQuantity(1);
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.productName} ({it.variantTitle}) · Max {it.quantity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Quantity to Return (Max {selectedItem.quantity}) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={selectedItem.quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value, 10) || 1)}
                  className="text-xs"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Reason for Return <span className="text-destructive">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="damaged_in_transit">Damaged in transit / Broken acrylic</option>
                  <option value="defective_quality">Defective quality / Surface scratch</option>
                  <option value="wrong_item">Wrong item delivered</option>
                  <option value="not_as_described">Not as described on website</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Please describe the issue in detail..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Photo Proof Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                    Photo Proof (Required for damage & defects)
                  </label>
                  <span className="text-3xs text-muted-foreground">JPG, PNG up to 8MB</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {returnPhotos.map((url, i) => (
                    <div key={i} className="relative size-16 rounded-lg border border-border overflow-hidden group">
                      <Image src={url} alt="Proof" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-black"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className="size-16 rounded-lg border border-dashed border-border hover:border-foreground/50 flex flex-col items-center justify-center text-muted-foreground gap-1 text-3xs"
                  >
                    {isUploadingPhoto ? (
                      <SpinnerGap className="animate-spin" size={16} />
                    ) : (
                      <>
                        <UploadSimple size={16} />
                        <span>Add Photo</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {photoError && <p className="text-2xs text-destructive">{photoError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="gap-2 text-xs font-bold uppercase tracking-ui"
                >
                  {isPending && <SpinnerGap className="animate-spin" size={14} />} Submit Return Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
