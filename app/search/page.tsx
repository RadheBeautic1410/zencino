import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q
      ? `Search results for "${q}" - Zencino`
      : "Search Catalog - Zencino",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const trimmed = q?.trim() || "";

  const [{ products }, categories] = await Promise.all([
    trimmed
      ? getStorefrontProducts({ query: trimmed, pageSize: 36 })
      : Promise.resolve({ products: [] }),
    getStorefrontCategories(),
  ]);

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Search Input Banner */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Search Zencino
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find organizers, storage solutions, and home essentials.
          </p>

          <form action="/search" className="relative mt-6" method="GET">
            <input
              className="w-full rounded-full border border-border bg-background px-6 py-3.5 pl-12 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
              defaultValue={trimmed}
              name="q"
              placeholder="Search by keyword, material, product name..."
              type="text"
            />
            <MagnifyingGlass
              className="absolute left-4 top-4 text-muted-foreground"
              size={20}
            />
          </form>
        </div>

        {/* Results Section */}
        <div className="mt-12 border-t border-border pt-8">
          {trimmed ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-ui text-muted-foreground mb-6">
                Showing {products.length}{" "}
                {products.length === 1 ? "result" : "results"} for &quot;
                {trimmed}&quot;
              </p>

              {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                  <p className="text-base font-semibold">
                    No matching products found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    Try checking your spelling, using more general terms, or
                    browse popular categories below.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {categories.map((c) => (
                      <Link
                        className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-ui hover:bg-muted"
                        href={`/categories/${c.slug}`}
                        key={c.id}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xs font-bold uppercase tracking-ui text-muted-foreground mb-4">
                Popular Categories to Explore
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((c) => (
                  <Link
                    className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-ui hover:bg-muted"
                    href={`/categories/${c.slug}`}
                    key={c.id}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
