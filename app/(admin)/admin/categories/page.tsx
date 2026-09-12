import { CategoryManager } from "@/components/admin/category-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { getAllCategories } from "@/lib/catalog/queries";

export const metadata = {
  title: "Categories - Zencino Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <OrbitPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Organize Zencino's product catalog into browsable hierarchies."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
