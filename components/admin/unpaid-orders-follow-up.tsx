import {
  EnvelopeSimple,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildPaymentReminderText,
  buildWhatsAppUrl,
} from "@/lib/commerce/follow-up";
import { formatDateTime } from "@/lib/utils";

export interface UnpaidOrder {
  createdAt: Date;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  id: string;
  itemNames: string[];
  orderNumber: string;
  totalMinor: number;
}

function timeAgo(date: Date): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000)
  );
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours} h ago`;
  }
  return `${Math.round(hours / 24)} days ago`;
}

/**
 * Customers who reached the UPI step but did not pay. They gave this contact
 * for the order, so a reminder about that order is appropriate.
 */
export function UnpaidOrdersFollowUp({ orders }: { orders: UnpaidOrder[] }) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-300 dark:border-amber-800">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <WhatsappLogo size={18} /> Unpaid Orders — Follow Up ({orders.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These customers placed an order but have not paid yet. A short
          reminder within a few hours recovers many of them.
        </p>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border">
        {orders.map((order) => {
          const reminder = buildPaymentReminderText(order);
          const whatsAppUrl = buildWhatsAppUrl(order.customerPhone, reminder);
          return (
            <div
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={order.id}
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">
                    {order.customerName}
                  </span>
                  <Link
                    className="font-mono font-bold text-primary hover:underline"
                    href={`/admin/orders/${order.id}`}
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="font-bold">
                    ₹{(order.totalMinor / 100).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="truncate text-2xs text-muted-foreground">
                  {order.itemNames.join(", ") || "—"}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {order.customerPhone} · {order.customerEmail} ·{" "}
                  <span title={formatDateTime(order.createdAt)}>
                    {timeAgo(order.createdAt)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {whatsAppUrl && (
                  <Button asChild className="h-8 gap-1.5 text-xs" size="sm">
                    <a
                      href={whatsAppUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <WhatsappLogo size={14} /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  className="h-8 gap-1.5 text-xs"
                  size="sm"
                  variant="outline"
                >
                  <a href={`tel:${order.customerPhone}`}>
                    <Phone size={14} /> Call
                  </a>
                </Button>
                <Button
                  asChild
                  className="h-8 gap-1.5 text-xs"
                  size="sm"
                  variant="outline"
                >
                  <a
                    href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your Zencino order ${order.orderNumber}`)}&body=${encodeURIComponent(reminder)}`}
                  >
                    <EnvelopeSimple size={14} /> Email
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
