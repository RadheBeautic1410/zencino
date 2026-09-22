import { InventoryManager } from "@/components/admin/inventory-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { requireAdmin } from "@/lib/authz";
import {
  getAllVariantsStock,
  getRecentStockMovements,
} from "@/lib/commerce/inventory";

export const metadata = {
  title: "Inventory Management - Zencino Admin",
  description: "Stock balances, reservations, and inventory adjustment history",
};

export default async function AdminInventoryPage() {
  await requireAdmin();

  const [variants, movements] = await Promise.all([
    getAllVariantsStock(),
    getRecentStockMovements(40),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Monitor physical on-hand stock, customer checkout reservations, and execute audited manual stock adjustments."
        eyebrow="Fulfilment & Warehouse"
        title="Inventory Balances"
      />

      <InventoryManager movements={movements} variants={variants} />
    </div>
  );
}
