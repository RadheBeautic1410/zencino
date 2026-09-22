import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories } from "@/lib/catalog/queries";

export const metadata = {
  title: "New Product - Zencino Admin",
};

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <OrbitPageHeader
        description="Add a new product to Zencino's catalog with specifications and attributes."
        eyebrow="Catalog"
        title="New Product"
      />
      <ProductForm categories={categories} />
    </div>
  );
}
