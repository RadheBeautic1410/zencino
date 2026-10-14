import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { ShippingManager } from "@/components/admin/shipping-manager";
import { listShippingRates } from "@/lib/commerce/shipping";

export const metadata = {
  title: "Shipping - Zencino Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const rates = await listShippingRates();

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Set per-kg shipping rates by PIN code: exact PIN, PIN range or wildcard prefix. Orders are charged for the weight rounded up to the next kg."
        eyebrow="Fulfilment"
        title="Shipping Calculator"
      />

      <ShippingManager rates={rates} />
    </div>
  );
}
