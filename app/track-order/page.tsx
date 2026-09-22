import { OrderTrackingView } from "@/components/store/order-tracking-view";
import { StoreShell } from "@/components/store/store-shell";

export const metadata = {
  title: "Track Your Order - Zencino",
  description:
    "Check live delivery milestones, courier assignment, and AWB tracking for your Zencino direct orders.",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; contact?: string }>;
}) {
  const params = await searchParams;

  return (
    <StoreShell>
      <OrderTrackingView
        initialContact={params.contact || ""}
        initialOrderNumber={params.orderNumber || ""}
      />
    </StoreShell>
  );
}
