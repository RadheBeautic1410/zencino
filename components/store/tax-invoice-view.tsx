"use client";

import { ArrowLeft, Printer } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SELLER_INFO } from "@/config/platform";
import {
  calculateGstBreakdown,
  numberToWordsRupees,
} from "@/lib/commerce/rules";
import { formatDateTime } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  lineTotalMinor: number;
  productName: string;
  quantity: number;
  sku: string;
  unitPriceMinor: number;
  variantTitle: string;
}

interface InvoiceAddress {
  city: string;
  countryCode?: string;
  line1: string;
  line2?: string | null;
  phone: string;
  postcode: string;
  recipient: string;
  state: string;
}

interface TaxInvoiceViewProps {
  address: InvoiceAddress | null;
  backHref?: string;
  items: InvoiceItem[];
  order: {
    orderNumber: string;
    createdAt: Date | string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentStatus: string;
    paymentMethod: string;
    totalMinor: number;
    trackingCourier?: string | null;
    trackingNumber?: string | null;
  };
  proof?: {
    upiReference?: string | null;
    status?: string;
  } | null;
}

export function TaxInvoiceView({
  order,
  items,
  address,
  proof,
  backHref = "/account",
}: TaxInvoiceViewProps) {
  const buyerState = address?.state || "Maharashtra";
  const isInterState =
    buyerState.trim().toLowerCase() !== SELLER_INFO.state.toLowerCase();

  // Grand total in Rupees
  const totalRupees = Math.round(order.totalMinor / 100);
  const amountInWords = numberToWordsRupees(totalRupees);

  // Calculate item taxable breakdown
  const itemsTaxSummary = items.map((it) => {
    const taxInfo = calculateGstBreakdown(
      it.lineTotalMinor,
      buyerState,
      SELLER_INFO.state
    );
    return {
      ...it,
      taxInfo,
    };
  });

  const totalTaxableMinor = itemsTaxSummary.reduce(
    (sum, it) => sum + it.taxInfo.taxableValueMinor,
    0
  );
  const totalTaxMinor = itemsTaxSummary.reduce(
    (sum, it) => sum + it.taxInfo.taxMinor,
    0
  );
  const totalCgstMinor = itemsTaxSummary.reduce(
    (sum, it) => sum + it.taxInfo.cgstMinor,
    0
  );
  const totalSgstMinor = itemsTaxSummary.reduce(
    (sum, it) => sum + it.taxInfo.sgstMinor,
    0
  );
  const totalIgstMinor = itemsTaxSummary.reduce(
    (sum, it) => sum + it.taxInfo.igstMinor,
    0
  );

  return (
    <div className="min-h-screen bg-neutral-100 py-6 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Print Action Bar (Hidden when printing) */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
        <Button asChild className="gap-2 text-xs" size="sm" variant="outline">
          <Link href={backHref}>
            <ArrowLeft size={16} /> Back
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            className="gap-2 text-xs font-bold uppercase tracking-ui"
            onClick={() => window.print()}
            size="sm"
          >
            <Printer size={16} weight="bold" /> Print Tax Invoice
          </Button>
        </div>
      </div>

      {/* Tax Invoice Document (A4 format) */}
      <div className="mx-auto max-w-4xl rounded-xl border border-neutral-300 bg-white p-8 sm:p-12 shadow-sm text-neutral-900 print:border-none print:shadow-none print:p-0 print:text-black">
        {/* Header: Legal Entity & Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-neutral-900 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black tracking-tight text-neutral-900">
                zencino<span className="text-emerald-600">.</span>
              </span>
              <span className="text-2xs font-bold uppercase tracking-widest text-neutral-500 border border-neutral-300 rounded px-1.5 py-0.5">
                Official Retailer
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800">
              {SELLER_INFO.legalName}
            </p>
            <p className="text-2xs text-neutral-600 leading-relaxed max-w-sm mt-0.5">
              {SELLER_INFO.addressLine1}, {SELLER_INFO.addressLine2},{" "}
              {SELLER_INFO.city}, {SELLER_INFO.state} - {SELLER_INFO.pincode},{" "}
              {SELLER_INFO.country}
            </p>
            <div className="mt-2 text-2xs space-y-0.5 text-neutral-700">
              <p>
                <strong>GSTIN:</strong> {SELLER_INFO.gstin} ·{" "}
                <strong>State Code:</strong> {SELLER_INFO.stateCode} (
                {SELLER_INFO.state})
              </p>
              <p>
                <strong>PAN:</strong> {SELLER_INFO.pan} · <strong>CIN:</strong>{" "}
                {SELLER_INFO.cin}
              </p>
              <p>
                <strong>Support:</strong> {SELLER_INFO.supportEmail} ·{" "}
                {SELLER_INFO.supportPhone}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-xl font-black uppercase tracking-wider text-neutral-900">
              TAX INVOICE
            </h1>
            <p className="text-2xs text-neutral-500 uppercase tracking-ui font-medium">
              (Issued under Section 31 of CGST Act, 2017)
            </p>

            <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-2xs space-y-1 sm:text-right print:bg-transparent">
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">
                  Invoice / Order No:
                </span>{" "}
                <strong className="font-mono text-xs text-neutral-900">
                  {order.orderNumber}
                </strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">
                  Invoice Date:
                </span>{" "}
                <strong>{formatDateTime(order.createdAt)}</strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">
                  Place of Supply:
                </span>{" "}
                <strong>
                  {buyerState} ({isInterState ? "Inter-State" : "Intra-State"})
                </strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">
                  Reverse Charge:
                </span>{" "}
                <strong>No</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid gap-6 sm:grid-cols-2 py-6 border-b border-neutral-200 text-xs">
          <div>
            <h2 className="text-2xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              Billed To & Shipped To
            </h2>
            {address ? (
              <div className="space-y-1 text-neutral-800">
                <p className="text-sm font-bold text-neutral-900">
                  {address.recipient}
                </p>
                <p className="text-2xs">{address.line1}</p>
                {address.line2 && <p className="text-2xs">{address.line2}</p>}
                <p className="text-2xs">
                  {address.city}, {address.state} —{" "}
                  <strong>{address.postcode}</strong>
                </p>
                <p className="text-2xs">
                  Country: {address.countryCode || "IN"}
                </p>
                <p className="text-2xs mt-2">
                  <span className="text-neutral-500">Phone:</span>{" "}
                  {address.phone}
                </p>
                <p className="text-2xs">
                  <span className="text-neutral-500">Email:</span>{" "}
                  {order.customerEmail}
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-neutral-800">
                <p className="text-sm font-bold text-neutral-900">
                  {order.customerName}
                </p>
                <p className="text-2xs">Email: {order.customerEmail}</p>
                <p className="text-2xs">Phone: {order.customerPhone}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
              Payment & Dispatch Particulars
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-2xs space-y-2 print:bg-transparent">
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Instrument:</span>
                <strong className="uppercase">
                  {order.paymentMethod === "upi_qr"
                    ? "Direct UPI (NPCI QR Code)"
                    : order.paymentMethod}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Status:</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {order.paymentStatus}
                </span>
              </div>
              {proof?.upiReference && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Bank UTR / Ref:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {proof.upiReference}
                  </span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between border-t border-neutral-200 pt-1.5">
                  <span className="text-neutral-500">
                    Dispatch Courier & AWB:
                  </span>
                  <span className="font-medium text-neutral-900">
                    {order.trackingCourier || "Courier"} —{" "}
                    {order.trackingNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Goods Table */}
        <div className="py-6 border-b border-neutral-200 overflow-x-auto">
          <table className="w-full text-left text-2xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 bg-neutral-50 print:bg-transparent font-bold uppercase tracking-wider text-neutral-700">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Description of Goods</th>
                <th className="py-2.5 px-2">HSN</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Taxable Val (₹)</th>
                {isInterState ? (
                  <th className="py-2.5 px-2 text-right">IGST 18% (₹)</th>
                ) : (
                  <>
                    <th className="py-2.5 px-2 text-right">CGST 9% (₹)</th>
                    <th className="py-2.5 px-2 text-right">SGST 9% (₹)</th>
                  </>
                )}
                <th className="py-2.5 px-2 text-right">Gross Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              {itemsTaxSummary.map((it, idx) => (
                <tr className="align-top" key={it.id}>
                  <td className="py-3 px-2 font-mono text-neutral-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-bold text-neutral-900">
                      {it.productName}
                    </p>
                    <p className="text-3xs text-neutral-500">
                      Variant: {it.variantTitle} · SKU: {it.sku}
                    </p>
                  </td>
                  <td className="py-3 px-2 font-mono">
                    {SELLER_INFO.defaultHsn}
                  </td>
                  <td className="py-3 px-2 text-center font-bold">
                    {it.quantity}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    {(it.taxInfo.taxableValueMinor / 100).toFixed(2)}
                  </td>
                  {isInterState ? (
                    <td className="py-3 px-2 text-right font-mono">
                      {(it.taxInfo.igstMinor / 100).toFixed(2)}
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-2 text-right font-mono">
                        {(it.taxInfo.cgstMinor / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {(it.taxInfo.sgstMinor / 100).toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="py-3 px-2 text-right font-mono font-bold text-neutral-900">
                    {(it.lineTotalMinor / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Summary Breakdown */}
        <div className="py-6 border-b border-neutral-200 grid gap-6 sm:grid-cols-12">
          {/* Left: Amount in words */}
          <div className="sm:col-span-7 space-y-3">
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
                Invoice Total in Words
              </p>
              <p className="text-xs font-bold text-neutral-900 mt-1 italic">
                {amountInWords}
              </p>
            </div>

            <div className="rounded border border-neutral-200 p-3 text-3xs text-neutral-600 space-y-1">
              <p className="font-bold uppercase tracking-wider text-neutral-700">
                Declarations & Terms:
              </p>
              <ol className="list-decimal pl-3 space-y-0.5">
                <li>
                  We declare that this invoice shows the actual price of the
                  goods described and that all particulars are true and correct.
                </li>
                <li>
                  All optical acrylic products include protective peel-off film
                  on all glossy surfaces.
                </li>
                <li>
                  Replacement claims must be raised within 7 days of package
                  delivery with unboxing proof.
                </li>
                <li>Subject to Mumbai jurisdiction only.</li>
              </ol>
            </div>
          </div>

          {/* Right: Calculations breakdown */}
          <div className="sm:col-span-5 space-y-2 text-2xs">
            <div className="flex justify-between text-neutral-600">
              <span>Total Taxable Value:</span>
              <span className="font-mono">
                ₹{(totalTaxableMinor / 100).toFixed(2)}
              </span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-neutral-600">
                <span>Integrated GST (IGST 18%):</span>
                <span className="font-mono">
                  ₹{(totalIgstMinor / 100).toFixed(2)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-neutral-600">
                  <span>Central GST (CGST 9%):</span>
                  <span className="font-mono">
                    ₹{(totalCgstMinor / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>State GST (SGST 9%):</span>
                  <span className="font-mono">
                    ₹{(totalSgstMinor / 100).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-neutral-600">
              <span>Delivery & Handling:</span>
              <span className="font-mono">
                {order.totalMinor >= totalTaxableMinor + totalTaxMinor + 100
                  ? `₹${((order.totalMinor - (totalTaxableMinor + totalTaxMinor)) / 100).toFixed(2)}`
                  : "FREE"}
              </span>
            </div>

            <div className="border-t-2 border-neutral-900 pt-2 flex justify-between text-sm font-black text-neutral-900">
              <span>Grand Total (INR):</span>
              <span className="font-mono">
                ₹
                {(order.totalMinor / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Signatory */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-2xs text-neutral-600">
          <div className="space-y-0.5">
            <p className="font-semibold text-neutral-800">
              Computer Generated Document
            </p>
            <p className="text-3xs">
              No physical signature is required under Section 10A of the
              Information Technology Act, 2000.
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="font-bold text-neutral-900">
              For {SELLER_INFO.legalName}
            </p>
            <div className="h-10 flex items-center justify-end">
              <span className="font-mono text-3xs text-neutral-400 italic">
                [Authorized Signatory / Digitally Verified]
              </span>
            </div>
            <p className="text-3xs uppercase tracking-wider text-neutral-500">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
