"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  CheckCircle,
  Copy,
  DeviceMobile,
  Lock,
  Package,
  QrCode,
  ShieldCheck,
  SpinnerGap,
  Truck,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { saveAddressAction } from "@/app/actions/addresses";
import { createOrderAction, submitPaymentProofAction } from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
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

export interface SavedCustomerAddress {
  id: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postcode: string;
  isDefault: boolean;
}

export interface CheckoutViewProps {
  cart: {
    cartId: string | null;
    totalItems: number;
    subtotalMinor: number;
    items: CheckoutCartItem[];
  };
  initialEmail?: string;
  initialName?: string;
  savedAddresses?: SavedCustomerAddress[];
  isLoggedIn?: boolean;
}

interface OrderPaymentState {
  orderId: string;
  orderNumber: string;
  totalRupees: number;
  upiUri: string;
  qrSvg: string;
  upiId: string;
  upiName: string;
}

export function CheckoutView({
  cart,
  initialEmail = "",
  initialName = "",
  savedAddresses = [],
  isLoggedIn = false,
}: CheckoutViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress ? defaultAddress.id : "new"
  );
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  // Address inputs state
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [recipient, setRecipient] = useState(defaultAddress?.recipient || initialName);
  const [phone, setPhone] = useState(defaultAddress?.phone || "");
  const [line1, setLine1] = useState(defaultAddress?.line1 || "");
  const [line2, setLine2] = useState(defaultAddress?.line2 || "");
  const [city, setCity] = useState(defaultAddress?.city || "");
  const [state, setState] = useState(defaultAddress?.state || "");
  const [postcode, setPostcode] = useState(defaultAddress?.postcode || "");

  const handleSelectAddress = (addr: SavedCustomerAddress) => {
    setSelectedAddressId(addr.id);
    setRecipient(addr.recipient);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostcode(addr.postcode);
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId("new");
    setRecipient(initialName);
    setPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setState("");
    setPostcode("");
  };

  // Payment stage state
  const [orderPayment, setOrderPayment] = useState<OrderPaymentState | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Payment proof form state
  const [upiReference, setUpiReference] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.subtotalMinor / 100;
  const standardShipping = subtotal >= 999 ? 0 : 79;
  const estimatedTotal = subtotal + standardShipping;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("customerEmail", customerEmail);
    formData.append("recipient", recipient);
    formData.append("phone", phone);
    formData.append("line1", line1);
    formData.append("line2", line2);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("postcode", postcode);

    startTransition(async () => {
      const res = await createOrderAction(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.orderId && res.orderNumber && res.upiUri && res.qrSvg) {
        if (selectedAddressId === "new" && saveAddressToAccount && isLoggedIn) {
          const saveAddrData = new FormData();
          saveAddrData.append("recipient", recipient.trim());
          saveAddrData.append("phone", phone.trim());
          saveAddrData.append("line1", line1.trim());
          saveAddrData.append("line2", line2.trim());
          saveAddrData.append("city", city.trim());
          saveAddrData.append("state", state.trim());
          saveAddrData.append("postcode", postcode.trim());
          saveAddrData.append("isDefault", (savedAddresses.length === 0).toString());
          saveAddressAction(saveAddrData).catch(() => {});
        }

        setOrderPayment({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          totalRupees: res.totalRupees || estimatedTotal,
          upiUri: res.upiUri,
          qrSvg: res.qrSvg,
          upiId: res.upiId || "zencino@upi",
          upiName: res.upiName || "Zencino",
        });
      }
    });
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    setProofUploadError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/checkout/upload-proof", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setProofUploadError(data.error || "Failed to upload screenshot.");
      } else {
        setScreenshotUrl(data.url);
      }
    } catch {
      setProofUploadError("Network error while uploading screenshot.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPayment) return;

    if (!upiReference.trim() || upiReference.trim().length < 8) {
      setProofUploadError("Please enter your 8–24 character UPI Transaction Reference / UTR.");
      return;
    }

    if (!screenshotUrl) {
      setProofUploadError("Please upload the payment transfer screenshot before submitting.");
      return;
    }

    startTransition(async () => {
      setProofUploadError(null);
      const res = await submitPaymentProofAction(
        orderPayment.orderId,
        upiReference.trim(),
        screenshotUrl
      );

      if (res.error) {
        setProofUploadError(res.error);
      } else if (res.success && res.orderNumber) {
        router.push(`/checkout/success?orderNumber=${res.orderNumber}`);
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
            Complete your order with verified address details and direct UPI payment.
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
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Address Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCreateOrder} className="border border-border bg-card p-6 md:p-8 space-y-5 rounded-2xl">
            <h2 className="text-base font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
              <Truck size={18} /> Shipping & Contact Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Email Address for Confirmation <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Saved Addresses Quick Picker */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 pt-2 pb-3 border-y border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                      Select Delivery Destination
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className={`text-2xs font-semibold uppercase tracking-ui transition-colors ${
                        selectedAddressId === "new"
                          ? "text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      + Enter New Address
                    </button>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all text-xs ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card/60 hover:border-foreground/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-foreground">{addr.recipient}</span>
                            {addr.isDefault && (
                              <Badge
                                variant="secondary"
                                className="text-3xs uppercase tracking-ui bg-primary/10 text-primary border-primary/20"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground truncate">{addr.line1}</p>
                          <p className="text-2xs text-muted-foreground">
                            {addr.city}, {addr.state} — <span className="font-mono">{addr.postcode}</span>
                          </p>
                          <p className="text-2xs text-muted-foreground mt-0.5 font-mono">
                            Ph: {addr.phone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Recipient Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Arun Kumar"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Mobile Phone (10 digits) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Flat, House No., Building, Apartment <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Flat 402, Sunshine Heights"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Area, Street, Sector, Village (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="MG Road, Indiranagar"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    City / District <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    State <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    6-digit PIN Code <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="560001"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {isLoggedIn && selectedAddressId === "new" && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
                  <input
                    type="checkbox"
                    checked={saveAddressToAccount}
                    onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-muted-foreground font-medium">
                    Save this delivery address to my account for faster 1-click checkout next time
                  </span>
                </label>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={isPending || cart.items.length === 0}
                className="w-full h-12 text-sm font-bold uppercase tracking-ui"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap className="animate-spin" size={18} /> Reserving Stock & Preparing UPI...
                  </span>
                ) : (
                  <span>Proceed to UPI Payment (₹{estimatedTotal.toLocaleString("en-IN")})</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Items Summary */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-bold uppercase tracking-ui">Items in Bag ({cart.totalItems})</h2>

          <div className="divide-y divide-border max-h-96 overflow-y-auto pr-2">
            {cart.items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 items-center">
                <div className="relative size-14 shrink-0 overflow-hidden border border-border bg-muted/40 rounded-md">
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
              <span>Standard Delivery</span>
              <span className="font-semibold text-foreground">
                {subtotal >= 999 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span> : "₹79"}
              </span>
            </div>
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>Inclusive 18% GST</span>
              <span>₹{(Math.round(subtotal * (0.18 / 1.18))).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
              <span>Total Payable</span>
              <span className="text-xl font-black text-foreground">₹{estimatedTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="pt-2 text-2xs text-muted-foreground space-y-1.5 border-t border-border">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Direct Bank UPI Transfer · No gateway convenience fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-primary shrink-0" />
              <span>Free shipping automatically applied on orders over ₹999</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic UPI Payment Modal Stage */}
      {orderPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              type="button"
              onClick={() => setOrderPayment(null)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                <QrCode size={24} weight="bold" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Scan & Pay with Any UPI App</h2>
              <p className="text-xs text-muted-foreground">
                Order <strong className="text-foreground">{orderPayment.orderNumber}</strong> · Amount:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-black text-base">
                  ₹{orderPayment.totalRupees.toLocaleString("en-IN")}
                </strong>
              </p>
            </div>

            {/* QR Code & Mobile Link */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-white text-black mb-6">
              <div
                className="size-56 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: orderPayment.qrSvg }}
              />
              <p className="text-2xs text-neutral-500 mt-2 font-medium">
                Google Pay · PhonePe · Paytm · BHIM · Any Banking App
              </p>

              {/* Mobile Quick Intent Link */}
              <div className="w-full pt-3 mt-3 border-t border-neutral-200">
                <a
                  href={orderPayment.upiUri}
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 px-4 text-xs font-bold transition-colors"
                >
                  <DeviceMobile size={16} />
                  <span>Tap to Open UPI App (Mobile)</span>
                </a>
              </div>
            </div>

            {/* Copyable Details */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-2xs text-muted-foreground uppercase block mb-1 font-semibold">
                  Merchant UPI ID
                </span>
                <div className="flex items-center justify-between font-mono font-bold text-foreground">
                  <span className="truncate mr-1">{orderPayment.upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderPayment.upiId, "upiId")}
                    className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                    title="Copy UPI ID"
                  >
                    {copiedField === "upiId" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-2xs text-muted-foreground uppercase block mb-1 font-semibold">
                  Exact Amount
                </span>
                <div className="flex items-center justify-between font-mono font-bold text-foreground">
                  <span>₹{orderPayment.totalRupees.toLocaleString("en-IN")}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(orderPayment.totalRupees), "amount")}
                    className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                    title="Copy Amount"
                  >
                    {copiedField === "amount" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof Submission Form */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="block text-xs font-bold uppercase tracking-ui text-foreground mb-1.5">
                  1. UPI Transaction Reference / UTR <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 425612345678 (12-digit UTR)"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="mt-1 text-2xs text-muted-foreground">
                  Found in your UPI app receipt under &quot;UPI Ref No.&quot; or &quot;UTR&quot;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-ui text-foreground mb-1.5">
                  2. Upload Payment Screenshot <span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />

                {screenshotUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                      <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600" />
                      <span className="truncate">Screenshot uploaded successfully</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-2xs text-muted-foreground hover:text-foreground underline shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingProof}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-xs font-semibold text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all disabled:opacity-50"
                  >
                    {isUploadingProof ? (
                      <>
                        <SpinnerGap className="animate-spin" size={16} />
                        <span>Uploading screenshot...</span>
                      </>
                    ) : (
                      <>
                        <UploadSimple size={16} />
                        <span>Click to Select Screenshot (JPG, PNG, WebP)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {proofUploadError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                  <WarningCircle size={16} className="shrink-0" />
                  <span>{proofUploadError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || isUploadingProof}
                className="w-full h-12 text-sm font-bold uppercase tracking-ui"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap className="animate-spin" size={18} /> Confirming Payment Proof...
                  </span>
                ) : (
                  <span>Submit Payment Proof & Finish Order</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
