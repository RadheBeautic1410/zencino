import { Receipt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/authz";
import { getAdminOrders } from "@/lib/commerce/orders";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Orders Management - Zencino Admin",
  description:
    "Verify UPI payments, manage customer orders, and dispatch shipments.",
};

interface SearchParams {
  status?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status || "all";

  const ordersList = await getAdminOrders({
    status: statusFilter,
    limit: 50,
  });

  const filterTabs = [
    { label: "All Orders", value: "all" },
    { label: "Payment Review", value: "payment_review" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <OrbitPageHeader
          description="Verify direct UPI transfers, approve stock deductions, and manage shipment dispatch."
          eyebrow="Sales & Fulfilment"
          title="Customer Orders"
        />
        <Button
          asChild
          className="h-8 text-xs font-bold uppercase tracking-ui"
          size="sm"
          variant="outline"
        >
          <Link href="/admin/returns">Return Claims Queue</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <Button
              asChild
              className="text-xs h-8"
              key={tab.value}
              size="sm"
              variant={isActive ? "default" : "outline"}
            >
              <Link
                href={
                  tab.value === "all"
                    ? "/admin/orders"
                    : `/admin/orders?status=${tab.value}`
                }
              >
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt size={18} /> Orders ({ordersList.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date Placed</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-center">Payment Status</TableHead>
                <TableHead className="text-center">Order Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersList.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-xs text-muted-foreground"
                    colSpan={7}
                  >
                    No orders found matching the selected status filter.
                  </TableCell>
                </TableRow>
              ) : (
                ordersList.map((ord) => {
                  const isReviewNeeded =
                    ord.status === "payment_review" ||
                    ord.paymentStatus === "under_review";
                  const isVerified = ord.paymentStatus === "verified";
                  const isRejected = ord.paymentStatus === "rejected";

                  return (
                    <TableRow
                      className={
                        isReviewNeeded
                          ? "bg-amber-50/40 dark:bg-amber-950/20"
                          : ""
                      }
                      key={ord.id}
                    >
                      <TableCell className="font-mono text-xs font-bold">
                        <Link
                          className="hover:underline text-primary"
                          href={`/admin/orders/${ord.id}`}
                        >
                          {ord.orderNumber}
                        </Link>
                        {ord.paymentMethod === "upi_qr" && (
                          <span className="block font-sans text-2xs text-muted-foreground uppercase mt-0.5">
                            UPI QR Transfer
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {ord.customerName}
                        </div>
                        <div className="text-2xs text-muted-foreground truncate">
                          {ord.customerEmail} · {ord.customerPhone}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {ord.createdAt ? formatDateTime(ord.createdAt) : "—"}
                      </TableCell>

                      <TableCell className="text-right font-bold text-xs">
                        ₹{(ord.totalMinor / 100).toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell className="text-center">
                        {isReviewNeeded ? (
                          <Badge
                            className="text-2xs uppercase border-amber-500 text-amber-600 dark:text-amber-400 font-bold animate-pulse"
                            variant="outline"
                          >
                            Review Proof
                          </Badge>
                        ) : isVerified ? (
                          <Badge
                            className="text-2xs uppercase text-emerald-600 dark:text-emerald-400 font-bold"
                            variant="secondary"
                          >
                            Verified
                          </Badge>
                        ) : isRejected ? (
                          <Badge
                            className="text-2xs uppercase"
                            variant="destructive"
                          >
                            Rejected
                          </Badge>
                        ) : (
                          <Badge
                            className="text-2xs uppercase text-muted-foreground"
                            variant="outline"
                          >
                            {ord.paymentStatus}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className="text-2xs uppercase"
                          variant={
                            ord.status === "delivered"
                              ? "secondary"
                              : ord.status === "cancelled"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {ord.status.replace("_", " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          asChild
                          className="h-7 text-xs font-semibold"
                          size="sm"
                          variant={isReviewNeeded ? "default" : "outline"}
                        >
                          <Link href={`/admin/orders/${ord.id}`}>
                            {isReviewNeeded ? "Verify Proof" : "Manage"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
