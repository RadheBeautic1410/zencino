import { ArrowLeft, Package } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
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
import { getAllAdminReturns, RETURN_REASONS } from "@/lib/commerce/returns";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Return Claims - Zencino Admin",
  description:
    "Inspect customer returns, verify transit damage photo proof, and process restock/refunds.",
};

interface SearchParams {
  q?: string;
  reason?: string;
  status?: string;
}

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status || "all";

  const returnsList = await getAllAdminReturns(statusFilter, {
    reason: resolvedParams.reason,
    search: resolvedParams.q,
  });

  const filterTabs = [
    { label: "All Returns", value: "all" },
    { label: "Pending Review", value: "requested" },
    { label: "Approved (In Transit)", value: "approved" },
    { label: "Received & Inspected", value: "received" },
    { label: "Completed", value: "completed" },
    { label: "Rejected", value: "rejected" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const reasonOptions = RETURN_REASONS.map((reason) => ({
    label: reason.replace(/_/g, " "),
    value: reason,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <OrbitPageHeader
          description="Review 7-day transit damage & replacement claims, inspect returned articles, and issue GST Credit Notes."
          eyebrow="Operations & Care"
          title="Customer Return Claims"
        />

        <Button asChild className="h-8 text-xs" size="sm" variant="outline">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-1.5" size={14} /> All Orders
          </Link>
        </Button>
      </div>

      <AdminFilterBar
        searchPlaceholder="Search return #, order #, customer, product or SKU..."
        selects={[{ label: "Reason", param: "reason", options: reasonOptions }]}
        tabs={{ param: "status", options: filterTabs }}
      />

      <Card className="border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package size={18} /> Return Claims ({returnsList.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return #</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item Returned</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Stock Action</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnsList.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-xs text-muted-foreground"
                    colSpan={8}
                  >
                    No return claims found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                returnsList.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {ret.returnNumber}
                      <span className="block font-sans text-3xs text-muted-foreground mt-0.5">
                        {formatDateTime(ret.createdAt)}
                      </span>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      <Link
                        className="text-primary hover:underline font-bold"
                        href={`/admin/orders/${ret.orderId}`}
                      >
                        {ret.orderNumber}
                      </Link>
                    </TableCell>

                    <TableCell className="max-w-xs text-xs">
                      <div className="font-semibold text-foreground truncate">
                        {ret.customerName}
                      </div>
                      <div className="text-2xs text-muted-foreground truncate">
                        {ret.customerEmail}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <p className="font-semibold text-foreground">
                        {ret.quantity}x {ret.productName}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {ret.variantTitle} ·{" "}
                        <span className="font-mono">{ret.sku}</span>
                      </p>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <span className="capitalize">
                        {ret.reason.replace(/_/g, " ")}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        className="text-2xs uppercase"
                        variant={
                          ret.status === "completed"
                            ? "secondary"
                            : ret.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {ret.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center text-2xs">
                      {ret.restockAction === "restocked" ? (
                        <span className="text-emerald-600 font-bold uppercase">
                          Restocked
                        </span>
                      ) : ret.restockAction === "scrapped" ? (
                        <span className="text-destructive font-bold uppercase">
                          Scrapped
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        asChild
                        className="h-7 text-xs font-semibold"
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/admin/orders/${ret.orderId}`}>
                          Inspect / Action
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
