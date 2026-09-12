import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";
import { CreditNoteView } from "@/components/store/credit-note-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_ROLE } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import { getOrderDetails } from "@/lib/commerce/orders";
import { getOrderReturnAndRefundDetails } from "@/lib/commerce/returns";

export const metadata = {
  title: "GST Credit Note - Zencino",
  robots: { index: false, follow: false },
};

export default async function OrderCreditNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ contact?: string; creditNote?: string }>;
}) {
  const { orderNumber } = await params;
  const { contact, creditNote: requestedCn } = await searchParams;

  const details = await getOrderDetails(orderNumber);
  if (!details) {
    notFound();
  }

  const { refunds, returns } = await getOrderReturnAndRefundDetails(details.order.id);
  if (refunds.length === 0) {
    notFound();
  }

  // Select requested credit note or the latest one
  const selectedRefund = requestedCn
    ? refunds.find((r) => r.creditNoteNumber === requestedCn) || refunds[0]
    : refunds[0];

  const matchingReturn = selectedRefund.returnId
    ? returns.find((r) => r.id === selectedRefund.returnId)
    : null;

  const session = await getCurrentSession();
  const isAdmin = session?.user?.role === ADMIN_ROLE;
  const isOwner = Boolean(session?.user?.id && details.order.userId === session.user.id);

  const cleanContact = (contact || "").trim().toLowerCase();
  const cleanPhone = cleanContact.replace(/\D/g, "");
  const matchesContact = Boolean(
    cleanContact &&
      (details.order.customerEmail.toLowerCase() === cleanContact ||
        (cleanPhone.length >= 10 &&
          details.order.customerPhone.replace(/\D/g, "").endsWith(cleanPhone)))
  );

  const isAuthorized = isAdmin || isOwner || matchesContact;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <LockKey size={24} weight="bold" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight">Credit Note Verification</h1>
            <p className="text-xs text-muted-foreground">
              To view the statutory GST Credit Note for{" "}
              <strong className="font-mono text-foreground">{orderNumber}</strong>, please confirm
              the email or phone number associated with this order.
            </p>
          </div>

          <form action="" method="GET" className="space-y-3 pt-2 text-left">
            <label className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
              Contact Email or Phone Number
            </label>
            <Input
              name="contact"
              type="text"
              required
              placeholder="e.g. name@example.com or 9876543210"
              defaultValue={contact || ""}
              className="text-xs"
            />
            <Button type="submit" className="w-full text-xs font-bold uppercase tracking-ui">
              Verify & View Credit Note
            </Button>
          </form>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link href={`/track-order?orderNumber=${orderNumber}`}>
                <ArrowLeft size={14} className="mr-1" /> Order Tracker
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link href="/account">My Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const backHref = isAdmin
    ? `/admin/orders/${details.order.id}`
    : session?.user
    ? `/account/orders/${details.order.orderNumber}`
    : `/track-order?orderNumber=${details.order.orderNumber}&contact=${encodeURIComponent(contact || "")}`;

  const returnedItemInfo = matchingReturn
    ? {
        productName: matchingReturn.productName || "Item",
        variantTitle: matchingReturn.variantTitle || "",
        sku: matchingReturn.sku || "",
        quantity: matchingReturn.quantity,
      }
    : null;

  return (
    <CreditNoteView
      order={details.order}
      refund={selectedRefund}
      returnedItem={returnedItemInfo}
      address={details.address}
      backHref={backHref}
    />
  );
}
