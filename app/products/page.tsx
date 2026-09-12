import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontCategories, getStorefrontProducts } from "@/lib/catalog/storefront";

export const metadata: Metadata = {
  title: "All Products - Zencino",
  description: "Browse Zencino's full catalog of acrylic organizers, home and kitchen essentials.",
};

interface SearchParams {
  category?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const categorySlug = resolved.category;
  const sort = resolved.sort || "newest";
  const page = Number(resolved.page) || 1;

  const [{ products, totalCount }, categories] = await Promise.all([
    getStorefrontProducts({
      categorySlug,
      sort,
      page,
      pageSize: 24,
    }),
    getStorefrontCategories(),
  ]);

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Header */}
        <div className="border-b border-border pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
            Zencino Catalog
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            All Products
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Thoughtfully crafted organization solutions for your everyday spaces. Available directly or on Amazon.
          </p>
        </div>

        {/* Categories Bar & Sort Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/products"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
                !categorySlug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              All Categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}${sort !== "newest" ? `&sort=${sort}` : ""}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
                  categorySlug === c.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">Sort:</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-ui">
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=newest`}
                className={`px-2 py-1 ${sort === "newest" ? "text-foreground underline" : "text-muted-foreground hover:text-foreground"}`}
              >
                Newest
              </Link>
              <span>·</span>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=price-asc`}
                className={`px-2 py-1 ${sort === "price-asc" ? "text-foreground underline" : "text-muted-foreground hover:text-foreground"}`}
              >
                Price: Low to High
              </Link>
              <span>·</span>
              <Link
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=price-desc`}
                className={`px-2 py-1 ${sort === "price-desc" ? "text-foreground underline" : "text-muted-foreground hover:text-foreground"}`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-base font-semibold">No products found in this selection</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try switching categories or view all products.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-block bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-ui text-primary-foreground"
              >
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
