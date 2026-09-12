import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontFeaturedCollections, getStorefrontProducts } from "@/lib/catalog/storefront";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collections = await getStorefrontFeaturedCollections();
  const collection = collections.find((c) => c.slug === slug);

  if (!collection) return { title: "Collection Not Found - Zencino" };

  return {
    title: `${collection.name} Collection - Zencino`,
    description: collection.description || `Discover the ${collection.name} curated collection from Zencino.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collections = await getStorefrontFeaturedCollections();
  const collection = collections.find((c) => c.slug === slug);

  if (!collection) {
    notFound();
  }

  const { products } = await getStorefrontProducts({
    collectionSlug: slug,
    pageSize: 36,
  });

  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Collections</Link>
          <span>/</span>
          <span className="text-foreground">{collection.name}</span>
        </nav>

        {/* Collection Hero Header */}
        <div className="border-b border-border pb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
            Curated Collection
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div className="mt-10">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-base font-semibold">No items currently in this collection</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We are curating new pieces for this collection.
              </p>
              <Link
                href="/products"
                className="mt-5 inline-block bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-ui text-primary-foreground"
              >
                Browse Catalog
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
