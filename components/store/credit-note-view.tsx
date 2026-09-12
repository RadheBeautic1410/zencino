"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SELLER_INFO } from "@/config/platform";
import { calculateGstBreakdown, numberToWordsRupees } from "@/lib/commerce/rules";
import { formatDateTime } from "@/lib/utils";

interface CreditNoteViewProps {
  order: {
    orderNumber: string;
    createdAt: Date | string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    totalMinor: number;
  };
  refund: {
    creditNoteNumber: string;
    refundNumber: string;
    amountMinor: number;
    reason: string;
    transactionReference?: string | null;
    processedAt: Date | string;
  };
  returnedItem?: {
    productName: string;
    variantTitle: string;
    sku: string;
    quantity: number;
  } | null;
  address: {
    recipient: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postcode: string;
    countryCode?: string;
  } | null;
  backHref?: string;
}

export function CreditNoteView({
  order,
  refund,
  returnedItem,
  address,
  backHref = "/account",
}: CreditNoteViewProps) {
  const buyerState = address?.state || "Maharashtra";
  const isInterState = buyerState.trim().toLowerCase() !== SELLER_INFO.state.toLowerCase();

  const refundRupees = Math.round(refund.amountMinor / 100);
  const amountInWords = numberToWordsRupees(refundRupees);

  const taxInfo = calculateGstBreakdown(refund.amountMinor, buyerState, SELLER_INFO.state);

  return (
    <div className="min-h-screen bg-neutral-100 py-6 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Print Action Bar */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
          <Link href={backHref}>
            <ArrowLeft size={16} /> Back
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.print()}
            size="sm"
            className="gap-2 text-xs font-bold uppercase tracking-ui"
          >
            <Printer size={16} weight="bold" /> Print GST Credit Note
          </Button>
        </div>
      </div>

      {/* Credit Note Document (A4 format) */}
      <div className="mx-auto max-w-4xl rounded-xl border border-neutral-300 bg-white p-8 sm:p-12 shadow-sm text-neutral-900 print:border-none print:shadow-none print:p-0 print:text-black">
        {/* Header: Legal Seller Entity & Credit Note Title */}
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
            <p className="text-xs font-bold text-neutral-800">{SELLER_INFO.legalName}</p>
            <p className="text-2xs text-neutral-600 leading-relaxed max-w-sm mt-0.5">
              {SELLER_INFO.addressLine1}, {SELLER_INFO.addressLine2}, {SELLER_INFO.city}, {SELLER_INFO.state} - {SELLER_INFO.pincode}, {SELLER_INFO.country}
            </p>
            <div className="mt-2 text-2xs space-y-0.5 text-neutral-700">
              <p>
                <strong>GSTIN:</strong> {SELLER_INFO.gstin} · <strong>State Code:</strong> {SELLER_INFO.stateCode} ({SELLER_INFO.state})
              </p>
              <p>
                <strong>PAN:</strong> {SELLER_INFO.pan} · <strong>CIN:</strong> {SELLER_INFO.cin}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-xl font-black uppercase tracking-wider text-rose-700">
              GST CREDIT NOTE
            </h1>
            <p className="text-2xs text-neutral-500 uppercase tracking-ui font-medium">
              (Issued under Section 34 of CGST Act, 2017)
            </p>

            <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-2xs space-y-1 sm:text-right print:bg-transparent">
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">Credit Note No:</span>{" "}
                <strong className="font-mono text-xs text-rose-700">{refund.creditNoteNumber}</strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">Credit Note Date:</span>{" "}
                <strong>{formatDateTime(refund.processedAt)}</strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">Original Tax Invoice No:</span>{" "}
                <strong className="font-mono text-neutral-900">{order.orderNumber}</strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">Original Invoice Date:</span>{" "}
                <strong>{formatDateTime(order.createdAt)}</strong>
              </p>
              <p>
                <span className="text-neutral-500 uppercase tracking-ui">Place of Supply:</span>{" "}
                <strong>{buyerState} ({isInterState ? "Inter-State" : "Intra-State"})</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Recipient / Customer Details */}
        <div className="grid gap-6 sm:grid-cols-2 py-6 border-b border-neutral-200 text-xs">
          <div>
            <h2 className="text-2xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              Credit Issued To
            </h2>
            {address ? (
              <div className="space-y-1 text-neutral-800">
                <p className="text-sm font-bold text-neutral-900">{address.recipient}</p>
                <p className="text-2xs">{address.line1}</p>
                {address.line2 && <p className="text-2xs">{address.line2}</p>}
                <p className="text-2xs">
                  {address.city}, {address.state} — <strong>{address.postcode}</strong>
                </p>
                <p className="text-2xs mt-1">
                  <span className="text-neutral-500">Phone:</span> {address.phone}
                </p>
                <p className="text-2xs">
                  <span className="text-neutral-500">Email:</span> {order.customerEmail}
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-neutral-800">
                <p className="text-sm font-bold text-neutral-900">{order.customerName}</p>
                <p className="text-2xs">Email: {order.customerEmail}</p>
                <p className="text-2xs">Phone: {order.customerPhone}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
              Reason & Settlement Particulars
            </h2>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-2xs space-y-2 print:bg-transparent">
              <div className="flex justify-between">
                <span className="text-neutral-500">Reason for Credit:</span>
                <strong className="text-neutral-900">{refund.reason}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Refund Settlement:</span>
                <strong className="uppercase">Direct Bank UPI Reversal</strong>
              </div>
              {refund.transactionReference && (
                <div className="flex justify-between border-t border-neutral-200 pt-1.5">
                  <span className="text-neutral-500">Bank Reversal UTR:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {refund.transactionReference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Adjustment Table */}
        <div className="py-6 border-b border-neutral-200 overflow-x-auto">
          <table className="w-full text-left text-2xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 bg-neutral-50 print:bg-transparent font-bold uppercase tracking-wider text-neutral-700">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Adjustment Particulars</th>
                <th className="py-2.5 px-2">HSN</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Taxable Adjustment (₹)</th>
                {isInterState ? (
                  <th className="py-2.5 px-2 text-right">IGST 18% (₹)</th>
                ) : (
                  <>
                    <th className="py-2.5 px-2 text-right">CGST 9% (₹)</th>
                    <th className="py-2.5 px-2 text-right">SGST 9% (₹)</th>
                  </>
                )}
                <th className="py-2.5 px-2 text-right">Total Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              <tr className="align-top">
                <td className="py-3 px-2 font-mono text-neutral-500">1</td>
                <td className="py-3 px-2">
                  <p className="font-bold text-neutral-900">
                    {returnedItem?.productName || "Order Refund & Sales Return Adjustment"}
                  </p>
                  <p className="text-3xs text-neutral-500">
                    {returnedItem
                      ? `Variant: ${returnedItem.variantTitle} · SKU: ${returnedItem.sku}`
                      : `Against Original Order ${order.orderNumber}`}
                  </p>
                </td>
                <td className="py-3 px-2 font-mono">{SELLER_INFO.defaultHsn}</td>
                <td className="py-3 px-2 text-center font-bold">{returnedItem?.quantity || 1}</td>
                <td className="py-3 px-2 text-right font-mono">
                  {(taxInfo.taxableValueMinor / 100).toFixed(2)}
                </td>
                {isInterState ? (
                  <td className="py-3 px-2 text-right font-mono">
                    {(taxInfo.igstMinor / 100).toFixed(2)}
                  </td>
                ) : (
                  <>
                    <td className="py-3 px-2 text-right font-mono">
                      {(taxInfo.cgstMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      {(taxInfo.sgstMinor / 100).toFixed(2)}
                    </td>
                  </>
                )}
                <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">
                  {(refund.amountMinor / 100).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Adjustment Breakdown */}
        <div className="py-6 border-b border-neutral-200 grid gap-6 sm:grid-cols-12">
          <div className="sm:col-span-7 space-y-3">
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-neutral-500">
                Credit Note Total in Words
              </p>
              <p className="text-xs font-bold text-neutral-900 mt-1 italic">
                {amountInWords}
              </p>
            </div>

            <div className="rounded border border-neutral-200 p-3 text-3xs text-neutral-600 space-y-1">
              <p className="font-bold uppercase tracking-wider text-neutral-700">Legal Declaration:</p>
              <p>
                This GST Credit Note is issued under Section 34 of the Central Goods and Services Tax Act, 2017.
                The output tax liability of the supplier and input tax credit (if applicable) shall be adjusted accordingly.
              </p>
            </div>
          </div>

          <div className="sm:col-span-5 space-y-2 text-2xs">
            <div className="flex justify-between text-neutral-600">
              <span>Taxable Value Adjusted:</span>
              <span className="font-mono">₹{(taxInfo.taxableValueMinor / 100).toFixed(2)}</span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-neutral-600">
                <span>Integrated GST (IGST 18%):</span>
                <span className="font-mono">₹{(taxInfo.igstMinor / 100).toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-neutral-600">
                  <span>Central GST (CGST 9%):</span>
                  <span className="font-mono">₹{(taxInfo.cgstMinor / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>State GST (SGST 9%):</span>
                  <span className="font-mono">₹{(taxInfo.sgstMinor / 100).toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="border-t-2 border-neutral-900 pt-2 flex justify-between text-sm font-black text-rose-700">
              <span>Total Credit Amount (INR):</span>
              <span className="font-mono">₹{(refund.amountMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer: Signatory */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-2xs text-neutral-600">
          <div className="space-y-0.5">
            <p className="font-semibold text-neutral-800">Computer Generated Credit Note</p>
            <p className="text-3xs">
              No physical signature is required under Section 10A of the Information Technology Act, 2000.
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="font-bold text-neutral-900">For {SELLER_INFO.legalName}</p>
            <div className="h-10 flex items-center justify-end">
              <span className="font-mono text-3xs text-neutral-400 italic">[Authorized Signatory / Digitally Verified]</span>
            </div>
            <p className="text-3xs uppercase tracking-wider text-neutral-500">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
