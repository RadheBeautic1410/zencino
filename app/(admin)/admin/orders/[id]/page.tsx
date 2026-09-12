import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { requireAdmin } from "@/lib/authz";
import { getOrderDetails } from "@/lib/commerce/orders";

export const metadata = {
  title: "Order Details - Zencino Admin",
  description: "Review payment proof, verify UTR, and manage order fulfillment.",
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

  return (
    <OrderDetailView
      order={details.order}
      items={details.items}
      address={details.address}
      proof={details.proof}
    />
  );
}
