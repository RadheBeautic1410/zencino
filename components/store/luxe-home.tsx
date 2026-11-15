import type { Icon } from "@phosphor-icons/react";
import {
  Airplane,
  ArrowRight,
  ArrowsClockwise,
  Baby,
  CookingPot,
  Crown,
  Cube,
  Diamond,
  Drop,
  Heartbeat,
  Leaf,
  Package,
  PencilSimple,
  Play,
  PuzzlePiece,
  ShieldCheck,
  ShoppingCart,
  Sparkle,
  Star,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import type { CategoryTile } from "@/components/store/category-grid";
import { CopyCode, LuxeRail } from "@/components/store/luxe-client";
import { delay, order } from "@/components/store/motion";
import type { ProductCardProps } from "@/components/store/product-card";
import { WaveEdge } from "@/components/store/wave-edge";
import type { HomepageContentData } from "@/lib/commerce/content";

type LuxeProduct = ProductCardProps["product"];

const money = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN")}`;

/** Price, struck MRP and the saving, or null when there is no saving. */
function pricing(product: LuxeProduct) {
  const price = product.minPriceMinor;
  const mrp = product.maxMrpMinor;
  const off =
    price && mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return { price, mrp: off ? mrp : null, off };
}

/* ────────────────────────────────────────────────────────────────────────
   Decoration
   ──────────────────────────────────────────────────────────────────────── */

/** Soft out-of-focus leaves at the edges, drawn in CSS so nothing ships. */
function Leaves() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="luxe-leaf top-[38%] -left-10 rotate-[-28deg]" />
      <span className="luxe-leaf luxe-leaf-sm top-[46%] -left-4 rotate-12" />
      <span className="luxe-leaf -right-12 top-[62%] rotate-[160deg]" />
      <span className="luxe-leaf luxe-leaf-sm top-[70%] -right-2 rotate-[200deg]" />
      <span className="luxe-leaf bottom-[16%] -left-14 rotate-[-10deg]" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   1. Hero
   ──────────────────────────────────────────────────────────────────────── */

interface LuxeHeroProps {
  content: HomepageContentData;
  secondaryCtaLink: string;
  secondaryCtaText: string;
}

/** The rendered showroom scene; its left side is kept empty for the copy. */
const HERO_SCENE = "/home/luxe-hero.png";

export function LuxeHero({
  content,
  secondaryCtaLink,
  secondaryCtaText,
}: LuxeHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Wide screens: the scene fills the band and the copy sits in its
          empty left side. */}
      <div
        aria-hidden
        className="intro-backdrop absolute inset-0 hidden [mask-image:linear-gradient(to_bottom,black_72%,transparent)] lg:block"
      >
        <Image
          alt=""
          className="object-cover object-[right_75%]"
          fill
          priority
          sizes="100vw"
          src={HERO_SCENE}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[oklch(0.24_0.06_167)] from-20% via-[oklch(0.24_0.06_167/0.4)] via-42% to-transparent to-60%" />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center px-6 pt-12 pb-6 sm:px-10 lg:min-h-[min(56vw,52rem)] lg:pt-8 lg:pb-24">
        <div className="relative z-2 max-w-xl">
          <p className="intro text-2xs font-semibold uppercase tracking-[0.42em] text-white/75">
            {content.eyebrowBadge || "Premium home essentials"}
          </p>

          <h1 className="intro mt-5 font-heading text-[2.6rem] leading-[1.05] font-bold text-white sm:text-5xl lg:text-[3.3rem]">
            {content.headline}
            <span className="luxe-gold-text mt-1 block italic">
              {content.headlineSub}
            </span>
          </h1>

          <p
            className="intro mt-6 max-w-md text-sm leading-relaxed text-white/80 md:text-base"
            style={delay(300)}
          >
            {content.description}
          </p>

          <div
            className="intro mt-8 flex flex-wrap items-center gap-4"
            style={delay(420)}
          >
            <Link
              className="luxe-btn-gold group"
              href={content.ctaPrimaryLink || "/products"}
            >
              {content.ctaPrimaryText || "Shop Now"}
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                size={16}
                weight="bold"
              />
            </Link>
            <Link className="luxe-btn-ghost group" href={secondaryCtaLink}>
              <span className="grid size-6 place-items-center rounded-full bg-white text-primary">
                {content.heroVideoUrl?.trim() ? (
                  <Play size={10} weight="fill" />
                ) : (
                  <ArrowRight size={11} weight="bold" />
                )}
              </span>
              {secondaryCtaText}
            </Link>
          </div>
        </div>
      </div>

      {/* Narrow screens: the scene follows the copy, cropped to its display. */}
      <div aria-hidden className="relative aspect-4/3 lg:hidden">
        <Image
          alt=""
          className="object-cover object-[78%_50%]"
          fill
          priority
          sizes="100vw"
          src={HERO_SCENE}
        />
        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-[oklch(0.27_0.068_166)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-[oklch(0.25_0.064_166)]" />
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   2. Category pedestals
   ──────────────────────────────────────────────────────────────────────── */

/** First keyword found in the slug picks the icon; Sparkle otherwise. */
const CATEGORY_ICONS: [RegExp, Icon][] = [
  [/kitchen|cook|home/, CookingPot],
  [/storage|organi[sz]/, Package],
  [/office|station|desk|pen/, PencilSimple],
  [/display|showcase|acrylic/, Cube],
  [/travel|outdoor/, Airplane],
  [/baby|infant/, Baby],
  [/toy|kid|game/, PuzzlePiece],
  [/health|fitness|wellness/, Heartbeat],
  [/daily|essential|bath|clean|personal/, Drop],
  [/garden|plant/, Leaf],
];

const iconFor = (slug: string) =>
  CATEGORY_ICONS.find(([pattern]) => pattern.test(slug))?.[1] ?? Sparkle;

/**
 * The stage is drawn in a 1088×268 frame — the reference layout's own size —
 * so every number below reads straight off that design. `x` is the pedestal
 * centre as a share of the width; `bottom` is how far its base sits above the
 * stage's lower edge, in hundredths of the width (cqw); `tilt` turns the
 * glass a few degrees so the row does not look stamped out.
 */
const PEDESTALS = [
  { x: 11.2, bottom: 7.1, tilt: -6 },
  { x: 26.7, bottom: 9.4, tilt: 3 },
  { x: 41.5, bottom: 7.0, tilt: -2 },
  { x: 56.5, bottom: 8.2, tilt: 2 },
  { x: 72.2, bottom: 5.6, tilt: -3 },
  { x: 87.5, bottom: 8.1, tilt: 4 },
];

/** The curved emerald platform the pedestals stand on. */
function StagePlatform() {
  return (
    <svg
      aria-hidden
      className="luxe-stage-svg"
      preserveAspectRatio="none"
      viewBox="0 0 1088 268"
    >
      <defs>
        <linearGradient id="luxe-stage-top" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.5 0.08 165)" />
          <stop offset="0.55" stopColor="oklch(0.4 0.075 166)" />
          <stop offset="1" stopColor="oklch(0.33 0.07 166)" />
        </linearGradient>
        <linearGradient id="luxe-stage-front" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.3 0.065 166)" />
          <stop offset="1" stopColor="oklch(0.18 0.045 168)" />
        </linearGradient>
        <radialGradient cx="0.5" cy="0.15" id="luxe-stage-glow" r="0.6">
          <stop offset="0" stopColor="oklch(0.85 0.12 85 / 0.35)" />
          <stop offset="1" stopColor="oklch(0.85 0.12 85 / 0)" />
        </radialGradient>
      </defs>

      {/* Top face: back edge low on the left, sweeping up at the right. */}
      <path
        d="M0 148 C 180 118, 560 112, 840 118 C 950 121, 1030 96, 1088 62 L 1088 214 C 900 240, 480 246, 0 234 Z"
        fill="url(#luxe-stage-top)"
      />
      <path
        d="M0 148 C 180 118, 560 112, 840 118 C 950 121, 1030 96, 1088 62 L 1088 214 C 900 240, 480 246, 0 234 Z"
        fill="url(#luxe-stage-glow)"
      />
      {/* Front face */}
      <path
        d="M0 234 C 480 246, 900 240, 1088 214 L 1088 268 L 0 268 Z"
        fill="url(#luxe-stage-front)"
      />
      {/* Lit lip along the front edge and a faint one along the back */}
      <path
        d="M0 234 C 480 246, 900 240, 1088 214"
        fill="none"
        stroke="oklch(0.78 0.09 160 / 0.7)"
        strokeWidth="1.6"
      />
      <path
        d="M0 148 C 180 118, 560 112, 840 118 C 950 121, 1030 96, 1088 62"
        fill="none"
        stroke="oklch(0.7 0.08 160 / 0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}

export function CategoryPedestals({
  categories,
}: {
  categories: CategoryTile[];
}) {
  if (categories.length === 0) {
    return null;
  }
  const shown = categories.slice(0, PEDESTALS.length);

  return (
    <section aria-label="Shop by category" className="relative px-4 pb-6">
      {/* Wide screens: the curved stage, each tile on its own gold pedestal
          at the reference layout's staggered heights. */}
      <div className="luxe-stage relative mx-auto hidden max-w-6xl md:block">
        <StagePlatform />
        <ul>
          {shown.map((category, idx) => {
            const CategoryIcon = iconFor(category.slug);
            const spot = PEDESTALS[idx];
            return (
              <li
                className="luxe-stage-slot"
                key={category.id}
                style={
                  {
                    "--x": `${spot.x}%`,
                    "--b": `${spot.bottom}cqw`,
                    "--tilt": `${spot.tilt}deg`,
                    "--i": idx,
                  } as React.CSSProperties
                }
              >
                <Link
                  className="luxe-glass-tile luxe-stage-glass"
                  href={`/categories/${category.slug}`}
                >
                  <CategoryIcon className="luxe-glass-icon" weight="light" />
                  <span className="luxe-glass-label">{category.name}</span>
                </Link>
                <Image
                  alt=""
                  className="luxe-stage-pedestal"
                  height={887}
                  sizes="16vw"
                  src="/home/luxe-pedestal.png"
                  width={1774}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Narrow screens: the same tiles in a swipeable row on CSS plinths. */}
      <div className="luxe-floor mx-auto max-w-6xl md:hidden">
        <ul className="relative z-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pt-6 pb-10">
          {shown.map((category, idx) => {
            const CategoryIcon = iconFor(category.slug);
            return (
              <li
                className="luxe-cat shrink-0 snap-center"
                key={category.id}
                style={order(idx)}
              >
                <Link
                  className="group flex flex-col items-center"
                  href={`/categories/${category.slug}`}
                >
                  <span className="luxe-cat-tile">
                    <CategoryIcon
                      className="text-gold"
                      size={36}
                      weight="light"
                    />
                    <span className="mt-3 text-center text-[0.8rem] leading-tight font-medium text-white">
                      {category.name}
                    </span>
                  </span>
                  <span aria-hidden className="luxe-cat-plinth" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   3. Featured rail
   ──────────────────────────────────────────────────────────────────────── */

function LuxeProductCard({ product }: { product: LuxeProduct }) {
  const { price, mrp, off } = pricing(product);
  const href = `/products/${product.slug}`;

  return (
    <article className="luxe-card group" data-rail-card>
      <Link
        className="relative block aspect-[5/4] overflow-hidden rounded-t-[1.1rem] bg-linear-to-b from-white to-stone-100"
        href={href}
      >
        {product.primaryImage && (
          <Image
            alt={product.primaryImageAlt || product.name}
            className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.07]"
            fill
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22vw"
            src={product.primaryImage}
          />
        )}
        {product.primaryCategoryName && (
          <span className="absolute top-3 left-3 max-w-[70%] truncate rounded-full bg-primary px-3 py-1 text-2xs font-semibold text-white shadow-md">
            {product.primaryCategoryName}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
        {product.rating ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="text-gold" size={13} weight="fill" />
            <span className="font-semibold text-gold-deep">
              {product.rating.toFixed(1)}
            </span>
            {product.reviewCount ? `(${product.reviewCount})` : null}
          </p>
        ) : null}

        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-snug font-semibold text-foreground">
          <Link href={href}>{product.name}</Link>
        </h3>

        <div className="mt-2 flex items-center gap-2">
          {price ? (
            <>
              <span className="text-lg font-bold text-foreground">
                {money(price)}
              </span>
              {mrp && (
                <span className="text-xs text-muted-foreground line-through">
                  {money(mrp)}
                </span>
              )}
              {off > 0 && (
                <span className="ml-auto rounded-md bg-gold-subtle px-2 py-0.5 text-2xs font-bold text-gold-deep">
                  -{off}%
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              Pricing on request
            </span>
          )}
        </div>

        {/* Variants are chosen on the product page, so the button leads
            there rather than adding something behind the shopper. */}
        <Link className="luxe-btn-cart mt-3" href={href}>
          <ShoppingCart size={16} weight="bold" />
          Add to Cart
        </Link>
      </div>
    </article>
  );
}

export function FeaturedRail({ products }: { products: LuxeProduct[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    // Light band like "How it works", capped by waves. The band is one flat
    // colour (--light-band) so the waves, which fill with currentColor, match.
    <section className="luxe-light relative my-6 text-(--light-band)">
      <WaveEdge side="top" variant="bold" />

      <div className="relative overflow-clip bg-(--light-band) text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 top-8 size-96 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 sm:px-10 md:py-14 lg:grid-cols-[15rem_1fr]">
          <div className="reveal-item">
            <Crown className="text-gold" size={34} weight="duotone" />
            <h2 className="mt-3 font-heading text-4xl leading-tight font-bold text-foreground italic">
              Bestsellers
              <span className="block">at Zencino</span>
            </h2>
            <p className="mt-3 max-w-56 text-sm leading-relaxed text-muted-foreground">
              Most loved products picked for your home &amp; workspace.
            </p>
            <Link className="luxe-btn-gold-sm group mt-6" href="/products">
              View All
              <ArrowRight
                className="transition-transform group-hover:translate-x-1"
                size={14}
                weight="bold"
              />
            </Link>
          </div>

          <LuxeRail>
            {products.map((product) => (
              <LuxeProductCard key={product.id} product={product} />
            ))}
          </LuxeRail>
        </div>
      </div>

      <WaveEdge side="bottom" variant="bold" />
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   4. Trust bar
   ──────────────────────────────────────────────────────────────────────── */

const TRUST_ICONS: Record<string, Icon> = {
  ShieldCheck,
  Truck,
  Sparkle,
  Package,
  Leaf,
  Diamond,
  ArrowsClockwise,
};

const DEFAULT_TRUST = [
  {
    icon: "Diamond",
    title: "Premium Quality",
    subtitle: "Durable & long lasting",
  },
  {
    icon: "Truck",
    title: "Pan India Delivery",
    subtitle: "Shipped to your door",
  },
  {
    icon: "ShieldCheck",
    title: "Secure Payments",
    subtitle: "UPI, cards, netbanking & more",
  },
  {
    icon: "ArrowsClockwise",
    title: "Easy Returns",
    subtitle: "Hassle-free policy",
  },
];

export function TrustBar({ content }: { content: HomepageContentData }) {
  const items = content.highlights?.length
    ? content.highlights.slice(0, 4)
    : DEFAULT_TRUST;

  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10">
      <ul
        className={`luxe-trust grid gap-x-4 gap-y-5 px-6 py-5 sm:grid-cols-2 ${
          items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
        }`}
      >
        {items.map((item, idx) => {
          const TrustIcon = TRUST_ICONS[item.icon] ?? Sparkle;
          return (
            <li
              className="reveal-item flex items-center gap-4 lg:justify-center"
              key={item.title}
              style={order(idx)}
            >
              <TrustIcon
                className="shrink-0 text-gold-deep"
                size={36}
                weight="duotone"
              />
              <span>
                <span className="block text-sm font-bold text-foreground">
                  {item.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.subtitle}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   5. New arrival spotlight
   ──────────────────────────────────────────────────────────────────────── */

export function NewArrivalSpotlight() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-12 pb-4 sm:px-10">
      <Link
        className="group relative block overflow-hidden rounded-[2rem] shadow-[0_30px_60px_oklch(0.1_0.04_168/0.5)]"
        href="/products?sort=newest"
      >
        <div className="relative aspect-4/3 sm:aspect-16/9">
          <Image
            alt="New arrivals at Zencino"
            className="object-cover object-[70%_50%] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 1280px) 100vw, 1216px"
            src="/home/luxe-new-arrivals.png"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[oklch(0.24_0.06_167/0.75)] via-transparent via-50% to-transparent" />
        </div>

        <div className="absolute inset-y-0 left-0 flex w-full max-w-xl flex-col justify-center p-6 sm:p-10 lg:p-14">
          <h2 className="font-heading text-4xl leading-none font-bold text-white italic sm:text-5xl lg:text-6xl">
            <Sparkle
              className="-mb-1 mr-1 inline text-gold"
              size={30}
              weight="fill"
            />
            New Arrivals
          </h2>
          <p className="mt-4 text-sm text-white/85 sm:text-base">
            Fresh picks for your home &amp; workspace.
          </p>
          <span className="luxe-btn-gold-sm mt-6 self-start">
            Explore New Arrivals
            <ArrowRight
              className="transition-transform group-hover:translate-x-1"
              size={14}
              weight="bold"
            />
          </span>
        </div>
      </Link>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   6. Launch offer
   ──────────────────────────────────────────────────────────────────────── */

export interface OfferCoupon {
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderMinor: number;
}

export function OfferBanner({ coupon }: { coupon: OfferCoupon | null }) {
  if (!coupon) {
    return null;
  }

  const amount =
    coupon.discountType === "fixed"
      ? money(coupon.discountValue)
      : `${coupon.discountValue}%`;

  return (
    <section className="mx-auto max-w-7xl px-6 pt-6 pb-20 sm:px-10">
      <div className="luxe-offer reveal-item">
        <div aria-hidden className="luxe-gift">
          <Image
            alt=""
            className="object-contain"
            fill
            sizes="12rem"
            src="/home/luxe-gift.png"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="font-heading text-3xl font-bold text-primary italic md:text-4xl">
            Special Launch <span className="text-gold-deep">Offer</span>
          </h2>
          <p className="mt-1 text-lg text-foreground md:text-2xl">
            Flat <strong className="text-primary">{amount} OFF</strong>{" "}
            {coupon.description ? (
              <span className="text-muted-foreground">
                — {coupon.description}
              </span>
            ) : (
              <>on your order</>
            )}
          </p>
          {coupon.minOrderMinor > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              On orders above {money(coupon.minOrderMinor)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 md:border-l md:border-primary/15 md:pl-8">
          <CopyCode code={coupon.code} />
          <Link className="luxe-btn-cart px-6" href="/products">
            Shop Now
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Wrapper
   ──────────────────────────────────────────────────────────────────────── */

/** The dark emerald ground every luxe section sits on. */
export function LuxeCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="luxe-canvas relative overflow-clip">
      <Leaves />
      <div className="relative">{children}</div>
    </div>
  );
}
