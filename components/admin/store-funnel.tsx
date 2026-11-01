import { Card, CardContent } from "@/components/ui/card";
import type { StoreFunnelSummary } from "@/lib/commerce/campaigns";

/** All-traffic conversion funnel with the share of people kept at each step. */
export function StoreFunnel({ funnel }: { funnel: StoreFunnelSummary }) {
  const steps = [
    { label: "Visitors", value: funnel.visitors },
    { label: "Viewed Product", value: funnel.viewedProduct },
    { label: "Added to Cart", value: funnel.addedToCart },
    { label: "Started Checkout", value: funnel.startedCheckout },
    { label: "Orders Placed", value: funnel.ordersPlaced },
    { label: "Payment Verified", value: funnel.ordersPaid },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground mb-4">
          Store Funnel · Last {funnel.days} Days · Unique Visitors
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((step, i) => {
            const previous = i > 0 ? steps[i - 1].value : null;
            const kept =
              previous && previous > 0
                ? Math.round((step.value / previous) * 100)
                : null;
            return (
              <div
                className="p-3 bg-muted/20 border border-border rounded-lg space-y-1"
                key={step.label}
              >
                <span className="text-2xs font-semibold uppercase text-muted-foreground">
                  {step.label}
                </span>
                <p className="font-black text-xl">{step.value}</p>
                {kept !== null && (
                  <p className="text-2xs text-muted-foreground">
                    {kept}% of previous step
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
