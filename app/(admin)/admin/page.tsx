import {
  ArrowSquareOut,
  Clock,
  Headset,
  Megaphone,
  Package,
  Receipt,
  Tray,
} from "@phosphor-icons/react/dist/ssr";
import { count } from "drizzle-orm";
import Link from "next/link";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { emailOutbox, user } from "@/db/schema";
import { getExecutiveDashboardMetrics } from "@/lib/commerce/campaigns";
import { db } from "@/lib/db";
import { getQueueSummary } from "@/lib/worker/queue-inspection";

export const metadata = {
  title: "Admin Executive Overview - Zencino",
};

export default async function AdminOverviewPage() {
  const [metrics, queues, [userCount], [emailCount]] = await Promise.all([
    getExecutiveDashboardMetrics(),
    getQueueSummary(),
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(emailOutbox),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Unified commercial performance, multichannel attribution, and operational status."
        eyebrow="Admin Operations"
        title="Executive Overview"
      />

      {/* 1. Primary Commercial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Direct Paid Revenue */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-success">
              Direct Website Revenue
            </p>
            <Receipt className="text-success" size={20} />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            ₹{(metrics.paidDirectRevenueMinor / 100).toLocaleString("en-IN")}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>{metrics.paidDirectOrdersCount} verified direct orders</span>
            <Link
              className="text-primary hover:underline font-semibold"
              href="/admin/orders"
            >
              View orders →
            </Link>
          </div>
        </div>

        {/* Amazon Outbound Clicks (Strictly Separated from Direct Sales) */}
        <div className="border border-amber-500/30 bg-amber-500/5 p-6 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-amber-500">
              Amazon Outbound Clicks
            </p>
            <ArrowSquareOut className="text-amber-500" size={20} />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            {metrics.amazonOutboundClicks}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span className="text-2xs font-medium">
              Referral intent only · No unverified sales
            </span>
            <Link
              className="text-amber-600 hover:underline font-semibold"
              href="/admin/campaigns"
            >
              Attribution →
            </Link>
          </div>
        </div>

        {/* Unfulfilled Orders */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
              Awaiting Fulfilment
            </p>
            <Package className="text-primary" size={20} />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            {metrics.unfulfilledOrdersCount}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Pending carrier dispatch</span>
            <Link
              className="text-primary hover:underline font-semibold"
              href="/admin/orders?status=confirmed"
            >
              Dispatch queue →
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
              Low Stock Alerts
            </p>
            <Tray
              className={
                metrics.lowStockCount > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
              size={20}
            />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            {metrics.lowStockCount}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Variants at or below reorder level</span>
            <Link
              className="text-primary hover:underline font-semibold"
              href="/admin/inventory"
            >
              Inventory →
            </Link>
          </div>
        </div>

        {/* Open Support Tickets */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
              Open Support Inquiries
            </p>
            <Headset className="text-primary" size={20} />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            {metrics.openSupportTicketsCount}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Customer tickets awaiting response</span>
            <Link
              className="text-primary hover:underline font-semibold"
              href="/admin/support"
            >
              Inbox →
            </Link>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
              Active Campaigns
            </p>
            <Megaphone className="text-primary" size={20} />
          </div>
          <p className="font-black text-3xl md:text-4xl text-foreground">
            {metrics.activeCampaignsCount}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span>Instagram & social tracking links</span>
            <Link
              className="text-primary hover:underline font-semibold"
              href="/admin/campaigns"
            >
              Campaigns →
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Detailed Split: Recent Direct Orders vs Amazon Clicks */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Recent Direct Orders (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Recent Direct Website Orders
              </CardTitle>
              <CardDescription className="text-xs">
                Verified store transactions with item snapshots and customer
                contacts.
              </CardDescription>
            </div>
            <Button asChild size="xs" variant="secondary">
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders placed yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {metrics.recentOrders.map((ord) => (
                  <div
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                    key={ord.id}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          className="font-mono font-bold text-xs text-foreground hover:underline"
                          href={`/admin/orders/${ord.id}`}
                        >
                          {ord.orderNumber}
                        </Link>
                        <Badge
                          className="text-2xs"
                          variant={
                            ord.paymentStatus === "verified"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {ord.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ord.customerName} · {ord.customerEmail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">
                        ₹{(ord.totalMinor / 100).toLocaleString("en-IN")}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Amazon Clicks & System Health (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Amazon Clicks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ArrowSquareOut className="text-amber-500" size={18} />
                  Recent Amazon Outbound Intent
                </CardTitle>
                <CardDescription className="text-xs">
                  Logged customer redirects to verified Amazon India ASINs.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.recentAmazonClicks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No outbound Amazon clicks logged yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {metrics.recentAmazonClicks.map((clk) => (
                    <div
                      className="p-3 flex items-center justify-between text-xs"
                      key={clk.id}
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-bold truncate">
                          {clk.sku}
                        </p>
                        <p className="text-2xs text-muted-foreground">
                          {clk.campaignCode
                            ? `Campaign: ${clk.campaignCode}`
                            : "Direct PDP click"}
                        </p>
                      </div>
                      <span className="text-2xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(clk.occurredAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Infrastructure Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">
                System Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">
                  Active Background Queues
                </span>
                <span className="font-mono font-bold">{queues.length}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Outbox Email Jobs</span>
                <span className="font-mono font-bold">{emailCount.count}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">
                  Registered User Accounts
                </span>
                <span className="font-mono font-bold">{userCount.count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
