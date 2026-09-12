import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontCategories, getStorefrontProducts } from "@/lib/catalog/storefront";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getStorefrontCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) return { title: "Category Not Found - Zencino" };

  return {
    title: `${category.name} - Zencino`,
    description: category.description || `Discover ${category.name} from Zencino.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getStorefrontCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Find subcategories if any
  const subcategories = categories.filter((c) => c.parentId === category.id);

  const { products } = await getStorefrontProducts({
    categorySlug: slug,
    pageSize: 36,
  });

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Categories</Link>
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="border-b border-border pb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 text-base text-muted-foreground max-w-2xl">
              {category.description}
            </p>
          )}

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-ui text-muted-foreground mr-1">
                Subcategories:
              </span>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.slug}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-ui hover:bg-muted"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="mt-10">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-base font-semibold">No products in this category yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check back soon or explore our other collections.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-block bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-ui text-primary-foreground"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
