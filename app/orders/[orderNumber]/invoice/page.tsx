import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaxInvoiceView } from "@/components/store/tax-invoice-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_ROLE } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import { getOrderDetails } from "@/lib/commerce/orders";

export const metadata = {
  title: "Tax Invoice - Zencino",
  robots: { index: false, follow: false },
};

export default async function OrderInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ contact?: string }>;
}) {
  const { orderNumber } = await params;
  const { contact } = await searchParams;

  const details = await getOrderDetails(orderNumber);
  if (!details) {
    notFound();
  }

  const session = await getCurrentSession();
  const isAdmin = session?.user?.role === ADMIN_ROLE;
  const isOwner = Boolean(
    session?.user?.id && details.order.userId === session.user.id
  );

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
            <h1 className="text-xl font-black tracking-tight">
              Invoice Verification
            </h1>
            <p className="text-xs text-muted-foreground">
              To view and print the statutory Tax Invoice for{" "}
              <strong className="font-mono text-foreground">
                {orderNumber}
              </strong>
              , please confirm the email or phone number associated with this
              order.
            </p>
          </div>

          <form action="" className="space-y-3 pt-2 text-left" method="GET">
            <label
              className="block text-2xs font-semibold uppercase tracking-ui text-muted-foreground"
              htmlFor="invoice-contact"
            >
              Contact Email or Phone Number
            </label>
            <Input
              className="text-xs"
              defaultValue={contact || ""}
              id="invoice-contact"
              name="contact"
              placeholder="e.g. name@example.com or 9876543210"
              required
              type="text"
            />
            <Button
              className="w-full text-xs font-bold uppercase tracking-ui"
              type="submit"
            >
              Verify & View Invoice
            </Button>
          </form>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <Button asChild className="h-8 text-xs" size="sm" variant="ghost">
              <Link href={`/track-order?orderNumber=${orderNumber}`}>
                <ArrowLeft className="mr-1" size={14} /> Order Tracker
              </Link>
            </Button>

            <Button asChild className="h-8 text-xs" size="sm" variant="ghost">
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

  return (
    <TaxInvoiceView
      address={details.address}
      backHref={backHref}
      items={details.items}
      order={details.order}
      proof={details.proof}
    />
  );
}
