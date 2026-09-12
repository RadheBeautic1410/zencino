import { notFound } from "next/navigation";
import { CustomerOrderDetail } from "@/components/account/customer-order-detail";
import { AppShell } from "@/components/scaffold/app-shell";
import { ADMIN_ROLE } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getSecureCustomerOrder } from "@/lib/commerce/customer-account";

export const metadata = {
  title: "Order Details - Zencino",
  robots: { index: false, follow: false },
};

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const current = await requireSession();

  const details = await getSecureCustomerOrder(current.user.id, orderNumber);
  if (!details) {
    notFound();
  }

  return (
    <AppShell email={current.user.email} isAdmin={current.user.role === ADMIN_ROLE}>
      <CustomerOrderDetail
        order={details.order}
        items={details.items}
        address={details.address}
        proof={details.proof}
      />
    </AppShell>
  );
}
