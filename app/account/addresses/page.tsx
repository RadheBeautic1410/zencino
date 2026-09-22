import { AddressManager } from "@/components/account/address-manager";
import { AppShell } from "@/components/scaffold/app-shell";
import { PageHeader } from "@/components/scaffold/page-header";
import { ADMIN_ROLE } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getCustomerAddresses } from "@/lib/commerce/customer-account";

export const metadata = {
  title: "Delivery Addresses - Zencino",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const current = await requireSession();
  const addresses = await getCustomerAddresses(current.user.id);

  return (
    <AppShell
      email={current.user.email}
      isAdmin={current.user.role === ADMIN_ROLE}
    >
      <PageHeader
        description="Save multiple shipping destinations for fast one-click checkout across all devices."
        eyebrow="Account"
        title="Delivery Address Book"
      />

      <div className="mt-6">
        <AddressManager initialAddresses={addresses} />
      </div>
    </AppShell>
  );
}
