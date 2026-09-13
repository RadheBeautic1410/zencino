import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowSquareOut,
  FolderSimple,
  ShieldCheck,
  Sparkle,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import {
  getStorefrontCategories,
  getStorefrontFeaturedCollections,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";
import {
  type HomepageContentData,
  getPublishedContent,
} from "@/lib/commerce/content";

export default async function HomePage() {
  const [categories, collections, { products: featuredProducts }, { data: heroContent }] =
    await Promise.all([
      getStorefrontCategories(),
      getStorefrontFeaturedCollections(),
      getStorefrontProducts({ pageSize: 4 }),
      getPublishedContent<HomepageContentData>("home", "homepage"),
    ]);

  const primaryCollection = collections.find((c) => c.slug === "acrylic-essentials") || collections[0];

  return (
    <StoreShell>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-12 md:items-center md:py-28">
          <div className="md:col-span-7 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-success">
              <Sparkle size={14} weight="fill" /> {heroContent.eyebrowBadge}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl leading-tight">
              {heroContent.headline}
              <br />
              <span className="text-muted-foreground">{heroContent.headlineSub}</span>
            </h1>
            <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              {heroContent.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href={heroContent.ctaPrimaryLink || "/products"}
                className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {heroContent.ctaPrimaryText || "Shop All Products"} <ArrowRight size={14} />
              </Link>
              {primaryCollection && (
                <Link
                  href={`/collections/${primaryCollection.slug}`}
                  className="inline-flex items-center gap-2 border border-border bg-background px-6 py-3.5 text-xs font-bold uppercase tracking-ui text-foreground hover:bg-muted transition-colors"
                >
                  Explore {primaryCollection.name}
                </Link>
              )}
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary shrink-0" size={18} />
                <span>Diamond Polished</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowSquareOut className="text-amber-500 shrink-0" size={18} />
                <span>Amazon Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="text-primary shrink-0" size={18} />
                <span>Pan-India Delivery</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Showcase */}
          <div className="md:col-span-5">
            {featuredProducts[0] ? (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <p className="text-2xs font-bold uppercase tracking-ui text-success mb-3">
                  Featured Product
                </p>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
                  {featuredProducts[0].primaryImage && (
                    <Image
                      src={featuredProducts[0].primaryImage}
                      alt={featuredProducts[0].name}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  )}
                </div>
                <div className="mt-5 space-y-1">
                  <h2 className="font-bold text-base leading-snug">
                    <Link href={`/products/${featuredProducts[0].slug}`} className="hover:underline">
                      {featuredProducts[0].name}
                    </Link>
                  </h2>
                  {featuredProducts[0].minPriceMinor && (
                    <p className="font-black text-lg text-foreground">
                      ₹{(featuredProducts[0].minPriceMinor / 100).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="text-muted-foreground">Multiple buying options</span>
                  <Link
                    href={`/products/${featuredProducts[0].slug}`}
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Details <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-10 text-center">
                <p className="text-sm font-semibold">Welcome to Zencino</p>
                <p className="mt-2 text-xs text-muted-foreground">Catalog is loading.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Explore Categories Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
              Browse Taxonomy
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Categories
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold uppercase tracking-ui text-primary hover:underline inline-flex items-center gap-1"
          >
            View All Products <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col justify-between border border-border bg-card p-8 transition-all hover:border-foreground/50 hover:shadow-sm"
            >
              <div>
                <span className="text-2xs font-mono text-success">
                  0{idx + 1} /
                </span>
                <h3 className="mt-2 text-2xl font-bold group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {cat.description || "Discover thoughtfully designed pieces for this category."}
                </p>
              </div>
              <div className="mt-8 flex items-center text-xs font-semibold uppercase tracking-ui text-primary">
                <span>Explore Category</span>
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Collection Banner */}
      {primaryCollection && (
        <section className="border-y border-border bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-success">
                  Curated Collection
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                  {primaryCollection.name}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  {primaryCollection.description || "High-transparency, precision-crafted acrylic organizers designed to bring clarity and order to your everyday spaces."}
                </p>
                <div className="pt-4">
                  <Link
                    href={`/collections/${primaryCollection.slug}`}
                    className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Explore Collection <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <div className="border border-border bg-card p-6 space-y-2">
                  <p className="font-mono text-2xl font-black">99%</p>
                  <p className="text-xs font-bold uppercase tracking-ui text-foreground">
                    Optical Clarity
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    Crystal-clear viewing with high-grade acrylic.
                  </p>
                </div>
                <div className="border border-border bg-card p-6 space-y-2">
                  <p className="font-mono text-2xl font-black">Smooth</p>
                  <p className="text-xs font-bold uppercase tracking-ui text-foreground">
                    Polished Edges
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    Diamond-buffed for safety and refined aesthetics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Products Grid */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
                Featured Finds
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Trending at Zencino
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-ui text-primary hover:underline inline-flex items-center gap-1"
            >
              View Full Catalog ({featuredProducts.length}+) <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Honest Brand Quality Promise */}
      <section className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-3 text-center sm:text-left">
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-ui">
                Direct & Amazon Purchasing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose the way you prefer to shop. Order direct with Zencino or follow verified links to complete your purchase on Amazon India.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-ui">
                Truthful Specifications
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every dimension, weight, and material is verified. No misleading claims or exaggerated capacities.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-ui">
                Dedicated Support
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Questions about dimensions or care? Our team is based in India and ready to help you find the right organizer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
