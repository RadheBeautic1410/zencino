import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { requireAdmin } from "@/lib/authz";
import { getOrderDetails } from "@/lib/commerce/orders";
import { getOrderReturnAndRefundDetails } from "@/lib/commerce/returns";

export const metadata = {
  title: "Order Details - Zencino Admin",
  description:
    "Review payment proof, verify UTR, manage fulfillment, and process returns and refunds.",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const resolvedParams = await params;
  const details = await getOrderDetails(resolvedParams.id);

  if (!details) {
    notFound();
  }

  const { returns, refunds, cancellations } =
    await getOrderReturnAndRefundDetails(details.order.id);

  return (
    <OrderDetailView
      address={details.address}
      cancellations={cancellations}
      items={details.items}
      order={details.order}
      proof={details.proof}
      refunds={refunds}
      returns={returns}
    />
  );
}
