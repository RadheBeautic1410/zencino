import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowSquareOut,
  Leaf,
  Package,
  ShieldCheck,
  Sparkle,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { AcrylicScene } from "@/components/store/acrylic-scene";
import { delay, wordStep } from "@/components/store/motion";
import type { HomepageContentData } from "@/lib/commerce/content";

/**
 * The band lays its claims out in as many columns as there are claims, so a
 * row of three sits centred instead of hanging off an unused fourth column.
 * Tailwind only sees whole class names, hence the lookup.
 */
const HIGHLIGHT_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/** Icons the homepage content editor can reference by name in `highlights`. */
const HIGHLIGHT_ICONS: Record<string, Icon> = {
  ShieldCheck,
  ArrowSquareOut,
  Truck,
  Sparkle,
  Package,
  Leaf,
};

/**
 * Splits a headline for the per-word reveal. Index is folded into the id so
 * repeated words still get stable keys.
 */
const toWords = (line: string) =>
  line
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({ id: `${index}-${text}`, index, text }));

/**
 * Social proof beside the calls to action. No stock portraits ship with the
 * site, so the row is drawn from the brand palette — a tinted disc per initial
 * — rather than borrowing faces the shop does not own.
 */
const PROOF_INITIALS = ["A", "M", "R", "S"];

/** A product the hero can show when no clip or still is configured. */
interface HeroProduct {
  id: string;
  name: string;
  primaryImage: string | null;
}

interface HeroProps {
  content: HomepageContentData;
  products: HeroProduct[];
  secondaryCtaLink: string;
  secondaryCtaText: string;
}

/** Overlapping discs plus the customer count, closing the copy column. */
function ProofRow() {
  return (
    <div className="intro mt-10 flex items-center gap-4" style={delay(660)}>
      <ul className="-space-x-2.5 flex items-center">
        {PROOF_INITIALS.map((initial, idx) => (
          <li
            className="grid size-9 place-items-center rounded-full border-2 border-page font-heading text-xs font-semibold text-primary-soft"
            key={initial}
            style={{
              // Each disc a shade deeper, so the row reads as one group.
              background: `color-mix(in oklch, var(--primary) ${
                8 + idx * 5
              }%, var(--page))`,
            }}
          >
            {initial}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        <span className="font-bold text-foreground">20,000+</span> happy
        customers
      </p>
    </div>
  );
}

/**
 * Eyebrow, headline, description and the two calls to action — the whole left
 * column of the split.
 */
function HeroCopy({
  content,
  secondaryCtaLink,
  secondaryCtaText,
}: Omit<HeroProps, "products">) {
  const headlineWords = toWords(content.headline);
  const headlineSubWords = toWords(content.headlineSub);
  // The second line continues the first, so its stagger picks up where that ended.
  const subDelay = 90 + headlineWords.length * 85;

  return (
    <>
      <p className="intro text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
        {content.eyebrowBadge}
      </p>

      <h1 className="display mt-6 text-[2.75rem] text-foreground sm:text-5xl lg:text-[3.75rem]">
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

      <p
        className="intro mt-7 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base"
        style={delay(480)}
      >
        {content.description}
      </p>

      <div
        className="intro mt-9 flex flex-wrap items-center gap-3"
        style={delay(570)}
      >
        <Link
          className="group sheen inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          href={content.ctaPrimaryLink || "/products"}
        >
          {content.ctaPrimaryText || "Shop Collection"}
          <ArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1.5"
            size={13}
            weight="bold"
          />
        </Link>
        <Link
          className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-background px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          href={secondaryCtaLink}
        >
          {secondaryCtaText}
          <ArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1.5"
            size={13}
            weight="bold"
          />
        </Link>
      </div>

      <ProofRow />
    </>
  );
}

/** The caption card floating over the bottom-right corner of the picture. */
function CaptionCard() {
  return (
    <div className="absolute right-6 bottom-6 hidden items-center gap-4 rounded-2xl bg-background/92 px-5 py-3.5 shadow-lg backdrop-blur-sm md:flex">
      <span>
        <span className="display block text-sm text-foreground">
          Useful finds, every day.
        </span>
        <span className="mt-0.5 block text-2xs text-muted-foreground">
          Home, kitchen, stationery &amp; toys
        </span>
      </span>
      <Link
        aria-label="Shop the collection"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-foreground transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground"
        href="/products"
      >
        <ArrowRight size={14} weight="bold" />
      </Link>
    </div>
  );
}

/**
 * Real products from the catalog, kept to the half the copy does not use so
 * the range sits beside the words instead of under them.
 */
function ProductMosaic({ products }: { products: HeroProduct[] }) {
  return (
    <div className="ml-auto grid size-full grid-cols-2 gap-3 p-4 lg:w-1/2 lg:gap-4 lg:p-6">
      {products.map((product) => (
        <div
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-background"
          key={product.id}
        >
          {product.primaryImage && (
            <Image
              alt={product.name}
              className="object-contain p-2"
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 30vw"
              src={product.primaryImage}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * The backdrop — the clip when one is configured, else the still, else the
 * products, else 3D.
 */
function HeroMedia({
  content,
  products,
}: {
  content: HomepageContentData;
  products: HeroProduct[];
}) {
  const video = content.heroVideoUrl?.trim();
  const poster = content.heroVideoPoster?.trim();

  if (video) {
    return (
      <>
        <video
          autoPlay
          className="hero-video size-full object-cover"
          loop
          muted
          playsInline
          poster={poster || undefined}
          preload="metadata"
        >
          <source src={video} />
          <track kind="captions" />
        </video>

        {/* Takes over from the clip under reduced motion, so the section
            keeps its picture without moving. */}
        {poster && (
          <div
            className="hero-still absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}
      </>
    );
  }

  if (poster) {
    return (
      <Image
        alt=""
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={poster}
      />
    );
  }

  const pictured = products.filter((product) => product.primaryImage);

  if (pictured.length > 0) {
    return <ProductMosaic products={pictured} />;
  }

  return (
    <div className="grid size-full place-items-center bg-primary-wash/60 lg:justify-items-end lg:pr-[12%]">
      <AcrylicScene />
    </div>
  );
}

/** Editor-controlled claims — the band that closes the hero. */
function TrustStrip({ content }: { content: HomepageContentData }) {
  if (!content.highlights?.length) {
    return null;
  }

  const columns =
    HIGHLIGHT_COLUMNS[content.highlights.length] ?? "lg:grid-cols-4";

  return (
    <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
      <ul
        className={`mx-auto grid max-w-7xl gap-y-6 px-6 py-6 sm:grid-cols-2 ${columns}`}
      >
        {content.highlights.map((item, idx) => {
          const HighlightIcon = HIGHLIGHT_ICONS[item.icon] ?? Sparkle;
          return (
            <li
              className="intro group flex items-center gap-3.5 lg:justify-center"
              key={item.title}
              style={delay(820 + idx * 80)}
            >
              <HighlightIcon
                className="shrink-0 text-gold transition-transform duration-300 group-hover:-translate-y-0.5"
                size={24}
                weight="light"
              />
              <span>
                <span className="block text-xs font-bold text-primary-foreground">
                  {item.title}
                </span>
                <span className="block text-2xs text-primary-foreground/70">
                  {item.subtitle}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The homepage opening: the products or footage filling the screen, the copy
 * over them on the left where a cream scrim keeps the words readable.
 */
export function Hero({
  content,
  products,
  secondaryCtaLink,
  secondaryCtaText,
}: HeroProps) {
  const hasFootage = Boolean(
    content.heroVideoUrl?.trim() || content.heroVideoPoster?.trim()
  );

  return (
    <section className="screen-below-chrome relative flex flex-col overflow-hidden bg-page">
      {/* The footage is the ground the whole section stands on, not a panel
          beside the words. */}
      <div className="intro-backdrop absolute inset-0">
        <HeroMedia content={content} products={products} />
      </div>

      {/* The copy has to hold up against whatever frame is playing. Stacked,
          that takes a wash over the whole picture; side by side the cream only
          has to cover the half the words sit on, and the rest plays clear. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-page/85 lg:hidden"
      />
      {hasFootage && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-page from-38% via-page/55 via-64% to-transparent lg:block"
        />
      )}

      <div className="relative flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 md:py-16 lg:py-20">
          <div className="max-w-xl">
            <HeroCopy
              content={content}
              secondaryCtaLink={secondaryCtaLink}
              secondaryCtaText={secondaryCtaText}
            />
          </div>
        </div>

        <CaptionCard />
      </div>

      <TrustStrip content={content} />
    </section>
  );
}
