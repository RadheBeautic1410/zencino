import Link from "next/link";
import {
  ArrowSquareOut,
  Clock,
  CurrencyInr,
  MagnifyingGlass,
  Receipt,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
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
  description: "Verify UPI payments, manage customer orders, and dispatch shipments.",
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
          eyebrow="Sales & Fulfilment"
          title="Customer Orders"
          description="Verify direct UPI transfers, approve stock deductions, and manage shipment dispatch."
        />
        <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold uppercase tracking-ui">
          <Link href="/admin/returns">
            Return Claims Queue
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <Button
              key={tab.value}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
            >
              <Link href={tab.value === "all" ? "/admin/orders" : `/admin/orders?status=${tab.value}`}>
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
                  <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                    No orders found matching the selected status filter.
                  </TableCell>
                </TableRow>
              ) : (
                ordersList.map((ord) => {
                  const isReviewNeeded = ord.status === "payment_review" || ord.paymentStatus === "under_review";
                  const isVerified = ord.paymentStatus === "verified";
                  const isRejected = ord.paymentStatus === "rejected";

                  return (
                    <TableRow key={ord.id} className={isReviewNeeded ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}>
                      <TableCell className="font-mono text-xs font-bold">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="hover:underline text-primary"
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
                          <Badge variant="outline" className="text-2xs uppercase border-amber-500 text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                            Review Proof
                          </Badge>
                        ) : isVerified ? (
                          <Badge variant="secondary" className="text-2xs uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                            Verified
                          </Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="text-2xs uppercase">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-2xs uppercase text-muted-foreground">
                            {ord.paymentStatus}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={
                            ord.status === "delivered"
                              ? "secondary"
                              : ord.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-2xs uppercase"
                        >
                          {ord.status.replace("_", " ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild size="sm" variant={isReviewNeeded ? "default" : "outline"} className="h-7 text-xs font-semibold">
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
