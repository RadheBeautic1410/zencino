import {
  ArrowRight,
  ArrowSquareOut,
  Diamond,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/store/hero";
import {
  ChannelChoice,
  ClosingInvitation,
  CollectionRail,
  CraftProcess,
  HomeFaq,
} from "@/components/store/home-sections";
import { order, travel } from "@/components/store/motion";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { WaveEdge } from "@/components/store/wave-edge";
import {
  getStorefrontCategories,
  getStorefrontFeaturedCollections,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";
import {
  type FaqContentData,
  getPublishedContent,
  type HomepageContentData,
} from "@/lib/commerce/content";

export const metadata: Metadata = {
  title: {
    absolute: "Zencino — Crystal-Clear Acrylic Organizers & Home Essentials",
  },
  description:
    "Diamond-polished optical acrylic organizers for the home, kitchen and workspace. Shop direct with Zencino or through verified Amazon India listings.",
};

/** Ticker copy — short, factual claims that survive a slow read. */
const MARQUEE_CLAIMS = [
  "99% optical clarity",
  "Diamond-polished edges",
  "Shatter-resistant cast acrylic",
  "Pan-India delivery",
  "Amazon Prime eligible",
  "Verified specifications",
  "Designed for everyday order",
];

/**
 * One half of the ticker track. The claims run twice so a half stays wider
 * than any viewport — otherwise an ultra-wide screen sees the seam.
 */
const MARQUEE_HALF = [...MARQUEE_CLAIMS, ...MARQUEE_CLAIMS].map(
  (claim, index) => ({ claim, id: `${index}-${claim}` })
);

const SIGNATURE_STATS = [
  {
    value: "99%",
    label: "Optical clarity",
    detail: "Pure cast acrylic with glass-like transparency.",
  },
  {
    value: "Smooth",
    label: "Diamond polished",
    detail: "Buffed edges for a soft touch and refined feel.",
  },
];

const PROMISES = [
  {
    icon: ArrowSquareOut,
    title: "Direct & Amazon channels",
    body: "Shop the way you prefer. Order direct with Zencino for exclusive bundles, or follow verified links to our Amazon India listings and use Prime delivery.",
  },
  {
    icon: ShieldCheck,
    title: "Truthful specifications",
    body: "Every dimension, weight and material grade is verified before it is published. No exaggerated capacities, no retouched photography, no misleading claims.",
  },
  {
    icon: Truck,
    title: "Pan-India care",
    body: "Questions about sizing, fit or care? Our team is based in India and happy to help you choose the right organizer before you order.",
  },
];

export default async function HomePage() {
  const [
    categories,
    collections,
    { products: featuredProducts },
    { data: heroContent },
    { data: faqContent },
  ] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontFeaturedCollections(),
    getStorefrontProducts({ pageSize: 8 }),
    getPublishedContent<HomepageContentData>("home", "homepage"),
    getPublishedContent<FaqContentData>("faq", "faq"),
  ]);

  // Sub-categories belong on their parent's page, not in the homepage grid.
  const topLevelCategories = categories.filter((cat) => !cat.parentId);

  const primaryCollection =
    collections.find((c) => c.slug === "acrylic-essentials") || collections[0];

  // The signature band already carries the primary line, so the rail shows the
  // rest — and disappears entirely while there is only one collection.
  const otherCollections = collections
    .filter((c) => c.id !== primaryCollection?.id)
    .slice(0, 3);

  // A short set here; the FAQ page keeps the full list.
  const faqItems = (faqContent.items || []).slice(0, 5);

  const secondaryCtaLink =
    heroContent.ctaSecondaryLink ||
    (primaryCollection
      ? `/collections/${primaryCollection.slug}`
      : "/products");
  const secondaryCtaText =
    heroContent.ctaSecondaryText ||
    (primaryCollection
      ? `Explore ${primaryCollection.name}`
      : "Browse the catalog");

  return (
    <StoreShell>
      {/* 1. Hero — the clip carries it, with the 3D object as the fallback */}
      <Hero
        content={heroContent}
        secondaryCtaLink={secondaryCtaLink}
        secondaryCtaText={secondaryCtaText}
      />

      {/* 2. Editorial band — the page's first full-bleed statement */}
      <section className="reveal-soft relative text-primary">
        <WaveEdge side="top" />

        <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
          {/* Light entering from above, the way it enters the material */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(56% 58% at 50% 0%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 72%)",
            }}
          />
          <div
            aria-hidden
            className="parallax pointer-events-none absolute -left-24 top-0 size-[26rem] rounded-full bg-gold/10 blur-3xl"
            style={travel("3rem", "-3rem")}
          />
          <div
            aria-hidden
            className="parallax pointer-events-none absolute -right-20 bottom-0 size-[22rem] rounded-full bg-primary-foreground/[0.07] blur-3xl"
            style={travel("-2.5rem", "2.5rem")}
          />
          {/* A hairline frame gives the statement a deliberate edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-4 rounded-[2rem] border border-primary-foreground/10 md:inset-8"
          />

          <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
            <div className="mx-auto flex max-w-sm items-center gap-4">
              <span
                aria-hidden
                className="h-px flex-1 bg-linear-to-r from-transparent to-gold/60"
              />
              <p className="text-2xs font-bold uppercase tracking-eyebrow text-gold">
                The Zencino idea
              </p>
              <span
                aria-hidden
                className="h-px flex-1 bg-linear-to-l from-transparent to-gold/60"
              />
            </div>

            <h2 className="display mt-8 text-[2.5rem] text-primary-foreground sm:text-5xl lg:text-[4rem]">
              Clarity meets <span className="italic text-gold">calm</span>
            </h2>

            <p className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-primary-foreground/75 md:text-lg">
              Every Zencino piece is cut, polished and measured for one purpose
              — to make a shelf, a drawer or a countertop easier to live with.
              Optical-grade acrylic, honest dimensions, and a finish that still
              looks considered on the hundredth morning.
            </p>

            <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
              <Link
                className="sheen inline-flex items-center justify-center rounded-full bg-primary-foreground px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-gold-foreground"
                href="/products"
              >
                Discover Our Collection
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-primary-foreground/45 px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                href="/about"
              >
                The Zencino Story
              </Link>
            </div>
          </div>
        </div>

        <WaveEdge side="bottom" />
      </section>

      {/* 3. Claim ticker — one continuous line, paused on hover */}
      <div className="marquee border-b border-border/70 bg-primary-wash/60 py-3.5">
        <div className="marquee-track">
          {["primary", "mirror"].map((half) => (
            <ul
              aria-hidden={half === "mirror"}
              className="flex shrink-0 items-center"
              key={half}
            >
              {MARQUEE_HALF.map((item) => (
                <li
                  className="flex items-center gap-8 whitespace-nowrap px-8 text-2xs font-bold uppercase tracking-eyebrow text-primary-soft"
                  key={item.id}
                >
                  {item.claim}
                  <Diamond className="text-gold" size={8} weight="fill" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* 4. Categories */}
      {topLevelCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="reveal-soft mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Curated spaces</p>
              <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
                Explore by category
              </h2>
            </div>
            <Link
              className="group link-underline inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-ui text-primary"
              href="/products"
            >
              View all products
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                size={12}
                weight="bold"
              />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topLevelCategories.map((cat, idx) => (
              /* Reveal sits on the wrapper: its filled transform would
                 otherwise out-rank the card's own hover lift. */
              <div className="reveal-item" key={cat.id} style={order(idx)}>
                <Link
                  className="group card-hover glow-hover sheen sheen-gold relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-8 hover:border-gold/50"
                  href={`/categories/${cat.slug}`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 z-2 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="relative z-2">
                    <span className="display inline-block text-3xl text-border transition-all duration-500 group-hover:-translate-y-1 group-hover:text-gold">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="display mt-5 text-2xl text-foreground transition-colors duration-300 group-hover:text-primary">
                      {cat.name}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {cat.description ||
                        "Thoughtfully designed pieces selected for this part of the home."}
                    </p>
                  </div>
                  <span className="relative z-2 mt-10 inline-flex items-center gap-2 text-2xs font-bold uppercase tracking-ui text-primary">
                    Explore category
                    <ArrowRight
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                      size={13}
                      weight="bold"
                    />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. How the pieces are made */}
      <CraftProcess />

      {/* 6. Signature collection — the page's dark anchor band */}
      {primaryCollection && (
        <section className="grain relative overflow-hidden bg-primary text-primary-foreground">
          <div
            aria-hidden
            className="parallax pointer-events-none absolute -left-32 bottom-0 size-[32rem] rounded-full bg-gold/10 blur-3xl"
            style={travel("4rem", "-4rem")}
          />
          <div
            aria-hidden
            className="parallax pointer-events-none absolute -right-20 top-0 size-[24rem] rounded-full bg-primary-foreground/[0.07] blur-3xl"
            style={travel("-3rem", "3rem")}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-12 md:py-32">
            <div className="reveal-soft md:col-span-7">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-gold">
                Signature line
              </p>
              <h2 className="display mt-4 text-4xl text-primary-foreground md:text-5xl">
                {primaryCollection.name}
              </h2>
              <div aria-hidden className="rule-gold mt-6 w-24" />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/75">
                {primaryCollection.description ||
                  "High-transparency, precision-crafted acrylic organizers designed to bring clarity, peace and order to your everyday spaces."}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link
                  className="group sheen inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 text-xs font-bold uppercase tracking-ui text-gold-foreground transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105"
                  href={`/collections/${primaryCollection.slug}`}
                >
                  Explore the collection
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                    size={14}
                    weight="bold"
                  />
                </Link>
                {primaryCollection.productCount > 0 && (
                  <span className="text-2xs font-semibold uppercase tracking-ui text-primary-foreground/60">
                    {primaryCollection.productCount}{" "}
                    {primaryCollection.productCount === 1 ? "piece" : "pieces"}{" "}
                    in this line
                  </span>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 md:col-span-5">
              {SIGNATURE_STATS.map((stat, idx) => (
                <div
                  className="reveal-item group relative overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-6 backdrop-blur-xs transition-colors duration-500 hover:border-gold/40 hover:bg-primary-foreground/[0.1]"
                  key={stat.label}
                  style={order(idx)}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="display text-shimmer block text-3xl">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-2xs font-bold uppercase tracking-ui text-primary-foreground/90">
                      {stat.label}
                    </span>
                    <span className="mt-2 block text-2xs leading-relaxed text-primary-foreground/60">
                      {stat.detail}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* 7. The remaining published lines */}
      <CollectionRail collections={otherCollections} />

      {/* 8. Featured products */}
      {featuredProducts.length > 0 && (
        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="reveal-soft mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Curated finds</p>
                <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
                  Trending at Zencino
                </h2>
              </div>
              <Link
                className="group link-underline inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-ui text-primary"
                href="/products"
              >
                View full catalog
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  size={12}
                  weight="bold"
                />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((prod, idx) => (
                <div
                  className="reveal-item h-full"
                  key={prod.id}
                  style={order(idx % 4)}
                >
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Direct or Amazon */}
      <ChannelChoice />

      {/* 10. The Zencino promise */}
      <section className="border-t border-border/70 bg-secondary/60">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="reveal-soft max-w-2xl">
            <p className="eyebrow">The Zencino promise</p>
            <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
              Honest products, plainly described
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3">
            {PROMISES.map((item, idx) => (
              <div
                className="reveal-item group relative bg-card p-8 transition-colors duration-500 hover:bg-primary-wash/50 md:p-10"
                key={item.title}
                style={order(idx)}
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-wash text-primary-soft transition-all duration-500 group-hover:-translate-y-1 group-hover:rotate-6 group-hover:bg-gold-subtle group-hover:text-gold-foreground">
                  <item.icon size={20} weight="light" />
                </span>
                <h3 className="display mt-6 text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Questions people ask before ordering */}
      <HomeFaq items={faqItems} />

      {/* 12. Closing invitation, handing off to the footer */}
      <ClosingInvitation />
    </StoreShell>
  );
}
