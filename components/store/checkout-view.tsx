"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle,
  Copy,
  DeviceMobile,
  Package,
  QrCode,
  ShieldCheck,
  SpinnerGap,
  Truck,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveAddressAction } from "@/app/actions/addresses";
import {
  createOrderAction,
  submitPaymentProofAction,
} from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CheckoutCartItem {
  id: string;
  image: string | null;
  lineTotalMinor: number;
  productName: string;
  productSlug: string;
  quantity: number;
  sku: string;
  unitPriceMinor: number;
  variantId: string;
  variantTitle: string;
}

export interface SavedCustomerAddress {
  city: string;
  id: string;
  isDefault: boolean;
  line1: string;
  line2: string | null;
  phone: string;
  postcode: string;
  recipient: string;
  state: string;
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
  isLoggedIn?: boolean;
  savedAddresses?: SavedCustomerAddress[];
}

interface OrderPaymentState {
  orderId: string;
  orderNumber: string;
  qrSvg: string;
  totalRupees: number;
  upiId: string;
  upiName: string;
  upiUri: string;
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

  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress ? defaultAddress.id : "new"
  );
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  // Address inputs state
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [recipient, setRecipient] = useState(
    defaultAddress?.recipient || initialName
  );
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
  const [orderPayment, setOrderPayment] = useState<OrderPaymentState | null>(
    null
  );
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
      } else if (
        res.success &&
        res.orderId &&
        res.orderNumber &&
        res.upiUri &&
        res.qrSvg
      ) {
        if (selectedAddressId === "new" && saveAddressToAccount && isLoggedIn) {
          const saveAddrData = new FormData();
          saveAddrData.append("recipient", recipient.trim());
          saveAddrData.append("phone", phone.trim());
          saveAddrData.append("line1", line1.trim());
          saveAddrData.append("line2", line2.trim());
          saveAddrData.append("city", city.trim());
          saveAddrData.append("state", state.trim());
          saveAddrData.append("postcode", postcode.trim());
          saveAddrData.append(
            "isDefault",
            (savedAddresses.length === 0).toString()
          );
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

  const handleScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

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
    if (!orderPayment) {
      return;
    }

    if (!upiReference.trim() || upiReference.trim().length < 8) {
      setProofUploadError(
        "Please enter your 8–24 character UPI Transaction Reference / UTR."
      );
      return;
    }

    if (!screenshotUrl) {
      setProofUploadError(
        "Please upload the payment transfer screenshot before submitting."
      );
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
      <div className="mb-6 flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
            Checkout & Delivery
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete your order with verified address details and direct UPI
            payment.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-ui text-muted-foreground hover:text-primary transition-colors"
          href="/cart"
        >
          <ArrowLeft size={14} weight="bold" /> Back to Bag
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <WarningCircle className="shrink-0 mt-0.5" size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Address Form */}
        <div className="lg:col-span-7 space-y-6">
          <form
            className="border border-border/80 bg-card p-6 md:p-8 space-y-5 rounded-3xl shadow-sm"
            onSubmit={handleCreateOrder}
          >
            <h2 className="font-heading text-base font-bold uppercase tracking-ui text-foreground flex items-center gap-2">
              <Truck className="text-emerald-700" size={20} weight="bold" />
              <span>Shipping & Contact Details</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="checkout-view-email-address-for-confirmation"
                >
                  Email Address for Confirmation{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="checkout-view-email-address-for-confirmation"
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={customerEmail}
                />
              </div>

              {/* Saved Addresses Quick Picker */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 pt-2 pb-3 border-y border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                      Select Delivery Destination
                    </p>
                    <button
                      className={`text-2xs font-semibold uppercase tracking-ui transition-colors ${
                        selectedAddressId === "new"
                          ? "text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={handleSelectNewAddress}
                      type="button"
                    >
                      + Enter New Address
                    </button>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          className={`w-full text-left cursor-pointer rounded-xl border p-3 transition-all text-xs ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card/60 hover:border-foreground/30"
                          }`}
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          type="button"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-foreground">
                              {addr.recipient}
                            </span>
                            {addr.isDefault && (
                              <Badge
                                className="text-3xs uppercase tracking-ui bg-primary/10 text-primary border-primary/20"
                                variant="secondary"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="block text-2xs text-muted-foreground truncate">
                            {addr.line1}
                          </span>
                          <span className="block text-2xs text-muted-foreground">
                            {addr.city}, {addr.state} —{" "}
                            <span className="font-mono">{addr.postcode}</span>
                          </span>
                          <span className="block text-2xs text-muted-foreground mt-0.5 font-mono">
                            Ph: {addr.phone}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="checkout-view-recipient-full-name"
                  >
                    Recipient Full Name{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="text-xs"
                    id="checkout-view-recipient-full-name"
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Arun Kumar"
                    required
                    type="text"
                    value={recipient}
                  />
                </div>
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="checkout-view-mobile-phone-10-digits"
                  >
                    Mobile Phone (10 digits){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="text-xs"
                    id="checkout-view-mobile-phone-10-digits"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    type="tel"
                    value={phone}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="checkout-view-flat-house-no-building"
                >
                  Flat, House No., Building, Apartment{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="text-xs"
                  id="checkout-view-flat-house-no-building"
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Flat 402, Sunshine Heights"
                  required
                  type="text"
                  value={line1}
                />
              </div>

              <div>
                <label
                  className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="checkout-view-area-street-sector-village"
                >
                  Area, Street, Sector, Village (Optional)
                </label>
                <Input
                  className="text-xs"
                  id="checkout-view-area-street-sector-village"
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="MG Road, Indiranagar"
                  type="text"
                  value={line2}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="checkout-view-city-district"
                  >
                    City / District <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="text-xs"
                    id="checkout-view-city-district"
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    required
                    type="text"
                    value={city}
                  />
                </div>
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="checkout-view-state"
                  >
                    State <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="text-xs"
                    id="checkout-view-state"
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    required
                    type="text"
                    value={state}
                  />
                </div>
                <div>
                  <label
                    className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="checkout-view-6-digit-pin-code"
                  >
                    6-digit PIN Code <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="text-xs font-mono"
                    id="checkout-view-6-digit-pin-code"
                    maxLength={6}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="560001"
                    required
                    type="text"
                    value={postcode}
                  />
                </div>
              </div>

              {isLoggedIn && selectedAddressId === "new" && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
                  <input
                    checked={saveAddressToAccount}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                    onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-muted-foreground font-medium">
                    Save this delivery address to my account for faster 1-click
                    checkout next time
                  </span>
                </label>
              )}
            </div>

            <div className="pt-4 border-t border-border/80">
              <Button
                className="w-full h-12 text-sm font-extrabold uppercase tracking-ui rounded-full shadow-sm hover:scale-101 transition-all"
                disabled={isPending || cart.items.length === 0}
                type="submit"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap className="animate-spin" size={18} /> Reserving
                    Stock & Preparing UPI...
                  </span>
                ) : (
                  <span>
                    Proceed to UPI Payment (₹
                    {estimatedTotal.toLocaleString("en-IN")})
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Order Items Summary */}
        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-6 md:p-8 space-y-5 shadow-sm">
          <h2 className="font-heading text-base font-bold uppercase tracking-ui text-foreground">
            Items in Bag ({cart.totalItems})
          </h2>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-2">
            {cart.items.map((item) => (
              <div className="py-3 flex gap-3 items-center" key={item.id}>
                <div className="relative size-14 shrink-0 overflow-hidden border border-border/80 bg-muted/30 rounded-xl">
                  {item.image ? (
                    <Image
                      alt={item.productName}
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={item.image}
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground/30">
                      <Package size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">
                    {item.productName}
                  </p>
                  <p className="text-2xs text-muted-foreground truncate">
                    {item.variantTitle} · Qty: {item.quantity}
                  </p>
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
              <span className="font-semibold text-foreground">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Standard Delivery</span>
              <span className="font-semibold text-foreground">
                {subtotal >= 999 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    FREE
                  </span>
                ) : (
                  "₹79"
                )}
              </span>
            </div>
            <div className="flex justify-between text-2xs text-muted-foreground">
              <span>Inclusive 18% GST</span>
              <span>
                ₹{Math.round(subtotal * (0.18 / 1.18)).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
              <span>Total Payable</span>
              <span className="text-xl font-black text-foreground">
                ₹{estimatedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="pt-2 text-2xs text-muted-foreground space-y-1.5 border-t border-border">
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className="text-emerald-600 dark:text-emerald-400 shrink-0"
                size={14}
              />
              <span>
                Direct Bank UPI Transfer · No gateway convenience fees
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="text-primary shrink-0" size={14} />
              <span>
                Free shipping automatically applied on orders over ₹999
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic UPI Payment Modal Stage */}
      {orderPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <button
              className="absolute right-5 top-5 text-muted-foreground hover:text-foreground p-1"
              onClick={() => setOrderPayment(null)}
              type="button"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                <QrCode size={24} weight="bold" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Scan & Pay with Any UPI App
              </h2>
              <p className="text-xs text-muted-foreground">
                Order{" "}
                <strong className="text-foreground">
                  {orderPayment.orderNumber}
                </strong>{" "}
                · Amount:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-black text-base">
                  ₹{orderPayment.totalRupees.toLocaleString("en-IN")}
                </strong>
              </p>
            </div>

            {/* QR Code & Mobile Link */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-border bg-white text-black mb-6">
              <div
                className="size-56 flex items-center justify-center"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: QR markup is generated server-side by the qrcode library from our own UPI URI, never from user input.
                dangerouslySetInnerHTML={{ __html: orderPayment.qrSvg }}
              />
              <p className="text-2xs text-neutral-500 mt-2 font-medium">
                Google Pay · PhonePe · Paytm · BHIM · Any Banking App
              </p>

              {/* Mobile Quick Intent Link */}
              <div className="w-full pt-3 mt-3 border-t border-neutral-200">
                <a
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 px-4 text-xs font-bold transition-colors"
                  href={orderPayment.upiUri}
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
                    className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                    onClick={() => handleCopy(orderPayment.upiId, "upiId")}
                    title="Copy UPI ID"
                    type="button"
                  >
                    {copiedField === "upiId" ? (
                      <Check className="text-emerald-600" size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-2xs text-muted-foreground uppercase block mb-1 font-semibold">
                  Exact Amount
                </span>
                <div className="flex items-center justify-between font-mono font-bold text-foreground">
                  <span>
                    ₹{orderPayment.totalRupees.toLocaleString("en-IN")}
                  </span>
                  <button
                    className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                    onClick={() =>
                      handleCopy(String(orderPayment.totalRupees), "amount")
                    }
                    title="Copy Amount"
                    type="button"
                  >
                    {copiedField === "amount" ? (
                      <Check className="text-emerald-600" size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Proof Submission Form */}
            <form
              className="space-y-4 pt-4 border-t border-border"
              onSubmit={handleSubmitProof}
            >
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-ui text-foreground mb-1.5"
                  htmlFor="checkout-view-1-upi-transaction-reference"
                >
                  1. UPI Transaction Reference / UTR{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  className="font-mono text-xs"
                  id="checkout-view-1-upi-transaction-reference"
                  onChange={(e) => setUpiReference(e.target.value)}
                  placeholder="e.g. 425612345678 (12-digit UTR)"
                  required
                  type="text"
                  value={upiReference}
                />
                <p className="mt-1 text-2xs text-muted-foreground">
                  Found in your UPI app receipt under &quot;UPI Ref No.&quot; or
                  &quot;UTR&quot;.
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-ui text-foreground mb-1.5"
                  htmlFor="checkout-view-2-upload-payment-screenshot"
                >
                  2. Upload Payment Screenshot{" "}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="checkout-view-2-upload-payment-screenshot"
                  onChange={handleScreenshotUpload}
                  ref={fileInputRef}
                  type="file"
                />

                {screenshotUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                      <CheckCircle
                        className="shrink-0 text-emerald-600"
                        size={18}
                        weight="fill"
                      />
                      <span className="truncate">
                        Screenshot uploaded successfully
                      </span>
                    </div>
                    <button
                      className="text-2xs text-muted-foreground hover:text-foreground underline shrink-0 ml-2"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-xs font-semibold text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all disabled:opacity-50"
                    disabled={isUploadingProof}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
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
                  <WarningCircle className="shrink-0" size={16} />
                  <span>{proofUploadError}</span>
                </div>
              )}

              <Button
                className="w-full h-12 text-sm font-bold uppercase tracking-ui"
                disabled={isPending || isUploadingProof}
                type="submit"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <SpinnerGap className="animate-spin" size={18} /> Confirming
                    Payment Proof...
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
