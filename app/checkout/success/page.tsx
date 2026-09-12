import { notFound, redirect } from "next/navigation";
import { OrderSuccessView } from "@/components/store/order-success-view";
import { StoreShell } from "@/components/store/store-shell";
import { getOrderDetails } from "@/lib/commerce/orders";

export const metadata = {
  title: "Order Received - Zencino",
  description: "Your order details and payment verification status.",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.orderNumber;

  if (!orderNumber) {
    redirect("/products");
  }

  const details = await getOrderDetails(orderNumber);
  if (!details) {
    notFound();
  }

  return (
    <StoreShell>
      <OrderSuccessView
        order={details.order}
        items={details.items}
        address={details.address}
        proof={details.proof}
      />
    </StoreShell>
  );
}
