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
      <section className="relative overflow-hidden border-b border-border/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-page">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-12 md:items-center md:py-28">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-2xs">
              <Sparkle size={14} weight="fill" className="text-emerald-700" />
              <span>{heroContent.eyebrowBadge}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl leading-[1.08] font-heading text-foreground">
              {heroContent.headline}
              <br />
              <span className="text-muted-foreground/85">{heroContent.headlineSub}</span>
            </h1>

            <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              {heroContent.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href={heroContent.ctaPrimaryLink || "/products"}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>{heroContent.ctaPrimaryText || "Shop All Products"}</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
              {primaryCollection && (
                <Link
                  href={`/collections/${primaryCollection.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/90 bg-card px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-foreground hover:bg-muted/60 hover:-translate-y-0.5 transition-all duration-200 shadow-2xs"
                >
                  Explore {primaryCollection.name}
                </Link>
              )}
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-8 border-t border-border/60">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card/60 border border-border/60 text-xs font-medium text-foreground">
                <ShieldCheck className="text-emerald-700 shrink-0" size={20} weight="bold" />
                <span>Diamond Polished</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card/60 border border-border/60 text-xs font-medium text-foreground">
                <ArrowSquareOut className="text-amber-600 shrink-0" size={20} weight="bold" />
                <span>Amazon Verified</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card/60 border border-border/60 text-xs font-medium text-foreground">
                <Truck className="text-emerald-700 shrink-0" size={20} weight="bold" />
                <span>Pan-India Delivery</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Showcase */}
          <div className="md:col-span-5">
            {featuredProducts[0] ? (
              <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 shadow-xl card-hover transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xs font-bold uppercase tracking-ui text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    Spotlight Product
                  </p>
                  <span className="text-2xs font-semibold text-muted-foreground">In Stock</span>
                </div>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted/30">
                  {featuredProducts[0].primaryImage && (
                    <Image
                      src={featuredProducts[0].primaryImage}
                      alt={featuredProducts[0].name}
                      fill
                      priority
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  )}
                </div>
                <div className="mt-5 space-y-1.5">
                  <h2 className="font-heading font-bold text-lg leading-snug text-foreground">
                    <Link href={`/products/${featuredProducts[0].slug}`} className="hover:text-primary transition-colors">
                      {featuredProducts[0].name}
                    </Link>
                  </h2>
                  {featuredProducts[0].minPriceMinor && (
                    <p className="font-heading font-extrabold text-xl text-foreground">
                      ₹{(featuredProducts[0].minPriceMinor / 100).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs">
                  <span className="text-muted-foreground font-medium">Dual Channels Available</span>
                  <Link
                    href={`/products/${featuredProducts[0].slug}`}
                    className="font-bold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 uppercase tracking-ui text-xs"
                  >
                    <span>View Details</span>
                    <ArrowRight size={13} weight="bold" />
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
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-2">
              Curated Spaces
            </p>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
              Explore by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold uppercase tracking-ui text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
          >
            <span>View All Categories</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-8 card-hover transition-all duration-300 overflow-hidden"
            >
              <div className="relative z-10">
                <span className="text-xs font-mono font-bold text-emerald-700/80 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  0{idx + 1}
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {cat.description || "Discover thoughtfully designed pieces for this category."}
                </p>
              </div>
              <div className="relative z-10 mt-8 flex items-center text-xs font-bold uppercase tracking-ui text-primary">
                <span>Explore Category</span>
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1.5" size={14} weight="bold" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Collection Banner */}
      {primaryCollection && (
        <section className="border-y border-border/80 bg-stone-100/60 py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7 space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  Signature Line
                </p>
                <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-5xl text-foreground">
                  {primaryCollection.name}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  {primaryCollection.description || "High-transparency, precision-crafted acrylic organizers designed to bring clarity, peace, and order to your everyday spaces."}
                </p>
                <div className="pt-3">
                  <Link
                    href={`/collections/${primaryCollection.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2">
                  <p className="font-heading text-3xl font-extrabold text-foreground">99%</p>
                  <p className="text-xs font-bold uppercase tracking-ui text-emerald-800">
                    Optical Clarity
                  </p>
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    Pure cast acrylic with glass-like transparency.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-2">
                  <p className="font-heading text-3xl font-extrabold text-foreground">Smooth</p>
                  <p className="text-xs font-bold uppercase tracking-ui text-emerald-800">
                    Diamond Polished
                  </p>
                  <p className="text-2xs text-muted-foreground leading-relaxed">
                    Buffed edges for a soft touch and refined feel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Products Grid */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-2">
                Curated Finds
              </p>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
                Trending at Zencino
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold uppercase tracking-ui text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
            >
              <span>View Full Catalog ({featuredProducts.length}+)</span>
              <ArrowRight size={14} weight="bold" />
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
      <section className="border-t border-border/80 bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-2xs space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ArrowSquareOut size={20} weight="bold" />
              </div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-ui text-foreground">
                Direct & Amazon Channels
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose the way you prefer to shop. Order direct with Zencino for exclusive packages or follow verified links to Amazon India Prime.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-2xs space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheck size={20} weight="bold" />
              </div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-ui text-foreground">
                Truthful Specifications
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every dimension, weight, and material grade is strictly verified. No misleading claims, exaggerated capacities, or altered photos.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-2xs space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Truck size={20} weight="bold" />
              </div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-ui text-foreground">
                Dedicated Pan-India Care
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Questions about dimensions or care? Our team is based in India and ready to help you find the perfect organizer for your home.
              </p>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
