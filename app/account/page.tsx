import Link from "next/link";
import { AppShell } from "@/components/scaffold/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getCustomerOrders } from "@/lib/commerce/orders";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "My account - Zencino",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const current = await requireSession();
  const customerOrders = await getCustomerOrders(current.user.id);

  return (
    <AppShell
      email={current.user.email}
      isAdmin={current.user.role === ADMIN_ROLE}
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-ui text-muted-foreground">
        My Zencino
      </p>
      <h1 className="text-3xl font-black tracking-tight">
        Welcome, {current.user.name || "there"}
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Manage your profile, direct website orders, and delivery tracking.
      </p>

      {/* Account Quick Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          className="border border-border bg-card p-5 rounded-xl hover:border-foreground/40 transition-colors"
          href="/account/addresses"
        >
          <h2 className="text-base font-bold">Delivery Addresses</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your saved shipping addresses for fast 1-click checkout.
          </p>
        </Link>
        <Link
          className="border border-border bg-card p-5 rounded-xl hover:border-foreground/40 transition-colors"
          href="/account/profile"
        >
          <h2 className="text-base font-bold">Profile & Security</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your account credentials, email, and active login sessions.
          </p>
        </Link>
        <Link
          className="border border-border bg-card p-5 rounded-xl hover:border-foreground/40 transition-colors"
          href="/track-order"
        >
          <h2 className="text-base font-bold">Track Shipment</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Check delivery milestones and live courier tracking status.
          </p>
        </Link>
      </div>

      {/* Orders Section */}
      <div className="mt-10 space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Your Direct Orders</h2>

        {customerOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-3">
            <p>You haven&apos;t placed any direct website orders yet.</p>
            <Button asChild size="sm">
              <Link href="/products">Browse Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {customerOrders.map((ord) => (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-card p-4 text-xs gap-3"
                key={ord.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {ord.orderNumber}
                    </span>
                    <Badge
                      className="text-2xs uppercase"
                      variant={
                        ord.status === "confirmed" || ord.status === "delivered"
                          ? "secondary"
                          : ord.status === "cancelled"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {ord.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    Placed on {formatDateTime(ord.createdAt)} · Total: ₹
                    {(ord.totalMinor / 100).toLocaleString("en-IN")}
                  </p>
                  {ord.trackingNumber && (
                    <p className="text-2xs text-primary mt-1 font-medium">
                      Tracking ({ord.trackingCourier || "Courier"}):{" "}
                      {ord.trackingNumber}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    asChild
                    className="h-7 text-xs"
                    size="sm"
                    variant="outline"
                  >
                    <Link
                      href={`/orders/${ord.orderNumber}/invoice`}
                      target="_blank"
                    >
                      Invoice
                    </Link>
                  </Button>
                  <Button asChild className="h-7 text-xs" size="sm">
                    <Link href={`/account/orders/${ord.orderNumber}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
