import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowSquareOut,
  CaretDown,
  Diamond,
  Leaf,
  Package,
  ShieldCheck,
  Sparkle,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, Fragment } from "react";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import {
  getStorefrontCategories,
  getStorefrontFeaturedCollections,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";
import {
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

/** Custom properties carry the stagger, so there is no class per delay. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;
const order = (i: number) => ({ "--i": i }) as CSSProperties;
/** Word index plus the line's own delay, for the headline reveal. */
const wordStep = (i: number, base: number) =>
  ({ "--i": i, "--delay": `${base}ms` }) as CSSProperties;
/** Travel distance for a scroll-linked decorative layer. */
const travel = (from: string, to: string) =>
  ({ "--from": from, "--to": to }) as CSSProperties;

/**
 * Splits a headline for the per-word reveal. Index is folded into the id so
 * repeated words still get stable keys.
 */
const toWords = (line: string) =>
  line
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({ id: `${index}-${text}`, index, text }));

/** Icons the homepage content editor can reference by name in `highlights`. */
const HIGHLIGHT_ICONS: Record<string, Icon> = {
  ShieldCheck,
  ArrowSquareOut,
  Truck,
  Sparkle,
  Package,
  Leaf,
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
  ] = await Promise.all([
    getStorefrontCategories(),
    getStorefrontFeaturedCollections(),
    getStorefrontProducts({ pageSize: 8 }),
    getPublishedContent<HomepageContentData>("home", "homepage"),
  ]);

  // Sub-categories belong on their parent's page, not in the homepage grid.
  const topLevelCategories = categories.filter((cat) => !cat.parentId);

  const primaryCollection =
    collections.find((c) => c.slug === "acrylic-essentials") || collections[0];

  const [spotlight, companion] = featuredProducts;

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

  const headlineWords = toWords(heroContent.headline);
  const headlineSubWords = toWords(heroContent.headlineSub);
  // The second line continues the first, so its stagger picks up where that ended.
  const subDelay = 90 + headlineWords.length * 85;

  return (
    <StoreShell>
      {/* 1. Hero */}
      <section className="grain relative overflow-hidden bg-page">
        <div
          aria-hidden
          className="drift pointer-events-none absolute inset-x-0 -top-40 mx-auto size-[46rem] rounded-full bg-primary/[0.055] blur-3xl"
        />
        <div
          aria-hidden
          className="drift pointer-events-none absolute -right-24 top-1/3 size-[28rem] rounded-full bg-gold/10 blur-3xl"
          style={{
            animationDuration: "27s",
            animationDirection: "alternate-reverse",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-12 md:gap-12 md:py-28 lg:py-32">
          <div className="md:col-span-6">
            <span className="intro inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold-subtle px-4 py-1.5 text-2xs font-bold uppercase tracking-eyebrow text-gold-foreground">
              <Sparkle
                className="glow-breathe text-gold"
                size={12}
                weight="fill"
              />
              {heroContent.eyebrowBadge}
            </span>

            <h1 className="display mt-7 text-[2.75rem] text-foreground sm:text-6xl lg:text-[4.25rem]">
              {headlineWords.map((word) => (
                <Fragment key={word.id}>
                  <span className="intro-word" style={wordStep(word.index, 90)}>
                    {word.text}
                  </span>{" "}
                </Fragment>
              ))}
              <span className="mt-1 block italic text-primary-soft">
                {headlineSubWords.map((word) => (
                  <Fragment key={word.id}>
                    <span
                      className="intro-word"
                      style={wordStep(word.index, subDelay)}
                    >
                      {word.text}
                    </span>{" "}
                  </Fragment>
                ))}
              </span>
            </h1>

            <div
              aria-hidden
              className="intro-rule rule-gold mt-8 w-28"
              style={delay(420)}
            />

            <p
              className="intro mt-7 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg"
              style={delay(480)}
            >
              {heroContent.description}
            </p>

            <div
              className="intro mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
              style={delay(570)}
            >
              <Link
                className="group sheen inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
                href={heroContent.ctaPrimaryLink || "/products"}
              >
                {heroContent.ctaPrimaryText || "Shop All Products"}
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  size={14}
                  weight="bold"
                />
              </Link>
              <Link
                className="link-underline text-xs font-bold uppercase tracking-ui text-foreground/80 transition-colors hover:text-primary"
                href={secondaryCtaLink}
              >
                {secondaryCtaText}
              </Link>
            </div>
          </div>

          {/* Layered product composition */}
          <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
            {spotlight ? (
              <div
                className="intro-media relative mx-auto max-w-md md:mx-0"
                style={delay(220)}
              >
                <div className="float-soft group relative">
                  <div
                    aria-hidden
                    className="absolute -inset-2 translate-x-4 translate-y-4 rounded-[2rem] border border-gold/40 transition-transform duration-700 group-hover:translate-x-6 group-hover:translate-y-6"
                  />
                  <Link
                    className="group sheen tilt relative block aspect-4/5 overflow-hidden rounded-[1.75rem] border border-border/70 bg-primary-wash shadow-2xl"
                    href={`/products/${spotlight.slug}`}
                  >
                    {spotlight.primaryImage ? (
                      <Image
                        alt={spotlight.primaryImageAlt}
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                        fill
                        priority
                        sizes="(max-width: 768px) 90vw, 40vw"
                        src={spotlight.primaryImage}
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-primary/20">
                        <Package size={64} />
                      </span>
                    )}

                    <span className="absolute left-5 top-5 z-2 rounded-full bg-background/90 px-3 py-1 text-3xs font-bold uppercase tracking-ui text-primary shadow-xs backdrop-blur-xs">
                      Spotlight
                    </span>

                    <div className="absolute inset-x-0 bottom-0 z-2 bg-linear-to-t from-black/75 via-black/35 to-transparent p-6 pt-14">
                      <p className="display text-lg text-white">
                        {spotlight.name}
                      </p>
                      <div className="mt-2 flex items-baseline justify-between gap-3">
                        {spotlight.minPriceMinor ? (
                          <span className="display text-shimmer text-xl">
                            ₹
                            {(spotlight.minPriceMinor / 100).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-white/70">
                            Pricing on request
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-ui text-white/85">
                          View details
                          <ArrowRight
                            className="transition-transform duration-300 group-hover:translate-x-1"
                            size={12}
                            weight="bold"
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {companion && (
                  /* The entrance animation lives on the wrapper; a filling
                     animation on the card itself would out-rank its hover lift. */
                  <div
                    className="intro-media absolute -bottom-8 -left-6 hidden sm:block"
                    style={delay(760)}
                  >
                    <Link
                      className="group card-hover sheen sheen-gold block w-40 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
                      href={`/products/${companion.slug}`}
                    >
                      <span className="relative block aspect-square bg-primary-wash">
                        {companion.primaryImage ? (
                          <Image
                            alt={companion.primaryImageAlt}
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            fill
                            sizes="160px"
                            src={companion.primaryImage}
                          />
                        ) : (
                          <span className="grid size-full place-items-center text-primary/20">
                            <Package size={28} />
                          </span>
                        )}
                      </span>
                      <span className="block px-3 py-2.5">
                        <span className="block truncate text-2xs font-semibold text-foreground transition-colors group-hover:text-primary">
                          {companion.name}
                        </span>
                        {companion.minPriceMinor && (
                          <span className="block text-2xs text-muted-foreground">
                            ₹
                            {(companion.minPriceMinor / 100).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="intro-media rounded-[1.75rem] border border-border/70 bg-card p-12 text-center shadow-sm"
                style={delay(220)}
              >
                <Package className="mx-auto text-primary/25" size={40} />
                <p className="display mt-4 text-xl text-foreground">
                  Welcome to Zencino
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our catalog is being prepared. Check back shortly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quiet invitation to keep reading */}
        <div
          aria-hidden
          className="intro relative hidden justify-center pb-10 md:flex"
          style={delay(1100)}
        >
          <span className="scroll-cue flex flex-col items-center gap-1.5 text-3xs font-bold uppercase tracking-eyebrow text-muted-foreground">
            Scroll
            <CaretDown size={12} weight="bold" />
          </span>
        </div>

        {/* Trust strip — editor-controlled, unboxed so it reads as metadata */}
        {heroContent.highlights?.length > 0 && (
          <div className="relative border-y border-border/70 bg-background/70">
            <ul className="mx-auto grid max-w-7xl gap-y-5 px-6 py-6 sm:grid-cols-3 sm:divide-x sm:divide-border/70">
              {heroContent.highlights.map((item, idx) => {
                const HighlightIcon = HIGHLIGHT_ICONS[item.icon] ?? Sparkle;
                return (
                  <li
                    className="intro group flex items-center gap-3 sm:justify-center sm:px-4"
                    key={item.title}
                    style={delay(900 + idx * 90)}
                  >
                    <HighlightIcon
                      className="shrink-0 text-primary-soft transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-gold"
                      size={20}
                      weight="light"
                    />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-ui text-foreground">
                        {item.title}
                      </span>
                      <span className="block text-2xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* 2. Claim ticker — one continuous line, paused on hover */}
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

      {/* 3. Categories */}
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

      {/* 4. Signature collection — the page's dark anchor band */}
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

      {/* 5. Featured products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
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
        </section>
      )}

      {/* 6. The Zencino promise */}
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
    </StoreShell>
  );
}
