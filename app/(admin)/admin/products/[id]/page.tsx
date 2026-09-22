import { notFound } from "next/navigation";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { ProductEditorTabs } from "@/components/admin/product-editor-tabs";
import { getAllCategories, getProductWithDetails } from "@/lib/catalog/queries";

export const metadata = {
  title: "Edit Product - Zencino Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductWithDetails(id),
    getAllCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <OrbitPageHeader
        description={
          "Manage variants, channel options (Website & Amazon), specifications, and gallery."
        }
        eyebrow="Catalog / Products"
        title={product.name}
      />
      <ProductEditorTabs categories={categories} product={product} />
    </div>
  );
}
