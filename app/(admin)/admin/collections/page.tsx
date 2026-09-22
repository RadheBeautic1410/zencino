import { CollectionManager } from "@/components/admin/collection-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { getAdminProducts, getAllCollections } from "@/lib/catalog/queries";

export const metadata = {
  title: "Collections - Zencino Admin",
};

export default async function AdminCollectionsPage() {
  const [collections, products] = await Promise.all([
    getAllCollections(),
    getAdminProducts({ limit: 100 }),
  ]);

  const availableProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }));

  return (
    <div>
      <OrbitPageHeader
        description="Curate thematic product collections across categories."
        eyebrow="Catalog"
        title="Collections"
      />
      <CollectionManager
        availableProducts={availableProducts}
        collections={collections}
      />
    </div>
  );
}
