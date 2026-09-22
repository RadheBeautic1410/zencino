import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";

export const metadata: Metadata = {
  title: "All Products - Zencino",
  description:
    "Browse Zencino's full catalog of acrylic organizers, home and kitchen essentials.",
};

interface SearchParams {
  category?: string;
  page?: string;
  sort?: "newest" | "price-asc" | "price-desc";
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

  const [{ products }, categories] = await Promise.all([
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
        <div className="border-b border-border/80 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-2">
            Curated Catalog
          </p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl text-foreground">
            All Products
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Thoughtfully engineered crystal-clear organization solutions for
            your everyday spaces. Available directly or on Amazon Prime.
          </p>
        </div>

        {/* Categories Bar & Sort Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-ui transition-all ${
                categorySlug
                  ? "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  : "bg-primary text-primary-foreground shadow-2xs"
              }`}
              href="/products"
            >
              All Categories
            </Link>
            {categories.map((c) => (
              <Link
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-ui transition-all ${
                  categorySlug === c.slug
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
                href={`/products?category=${c.slug}${sort === "newest" ? "" : `&sort=${sort}`}`}
                key={c.id}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-ui text-muted-foreground">
              Sort:
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-ui">
              <Link
                className={`px-2 py-1 ${sort === "newest" ? "text-primary font-bold underline" : "text-muted-foreground hover:text-foreground"}`}
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=newest`}
              >
                Newest
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link
                className={`px-2 py-1 ${sort === "price-asc" ? "text-primary font-bold underline" : "text-muted-foreground hover:text-foreground"}`}
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=price-asc`}
              >
                Price: Low to High
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link
                className={`px-2 py-1 ${sort === "price-desc" ? "text-primary font-bold underline" : "text-muted-foreground hover:text-foreground"}`}
                href={`/products?${categorySlug ? `category=${categorySlug}&` : ""}sort=price-desc`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-card p-16 text-center shadow-2xs">
              <p className="font-heading text-lg font-bold text-foreground">
                No products found in this selection
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try switching categories or view all products.
              </p>
              <Link
                className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                href="/products"
              >
                Reset Catalog Filter
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
