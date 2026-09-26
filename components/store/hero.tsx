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
import Link from "next/link";
import { Fragment } from "react";
import { AcrylicScene } from "@/components/store/acrylic-scene";
import { delay, wordStep } from "@/components/store/motion";
import type { HomepageContentData } from "@/lib/commerce/content";

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

interface HeroProps {
  content: HomepageContentData;
  secondaryCtaLink: string;
  secondaryCtaText: string;
}

/**
 * Badge, headline, rule, description and the two calls to action. Shared by
 * both hero treatments so the copy never drifts between them.
 */
function HeroCopy({
  content,
  onVideo,
  secondaryCtaLink,
  secondaryCtaText,
}: HeroProps & { onVideo: boolean }) {
  const headlineWords = toWords(content.headline);
  const headlineSubWords = toWords(content.headlineSub);
  // The second line continues the first, so its stagger picks up where that ended.
  const subDelay = 90 + headlineWords.length * 85;

  return (
    <>
      <span className="intro inline-flex items-center gap-2 rounded-full border border-gold/45 bg-gold-subtle px-4 py-1.5 text-2xs font-bold uppercase tracking-eyebrow text-gold-foreground">
        <Sparkle className="glow-breathe text-gold" size={12} weight="fill" />
        {content.eyebrowBadge}
      </span>

      <h1
        className={`display mt-8 text-[2.5rem] text-foreground sm:text-5xl md:text-6xl ${
          onVideo ? "lg:text-[3.75rem]" : "lg:text-[4.25rem]"
        }`}
      >
        {headlineWords.map((word) => (
          <Fragment key={word.id}>
            <span className="intro-word" style={wordStep(word.index, 90)}>
              {word.text}
            </span>{" "}
          </Fragment>
        ))}
        <span className="mt-2 block italic text-primary-soft">
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
        className={`intro mt-9 h-px w-28 bg-linear-to-r from-transparent via-gold to-transparent ${
          onVideo ? "md:from-gold md:via-gold/40 md:to-transparent" : ""
        }`}
        style={delay(420)}
      />

      <p
        className={`intro mt-8 text-base leading-relaxed text-muted-foreground md:text-lg ${
          onVideo ? "max-w-lg" : "max-w-2xl"
        }`}
        style={delay(480)}
      >
        {content.description}
      </p>

      <div
        className={`intro mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 ${
          onVideo ? "justify-center md:justify-start" : "justify-center"
        }`}
        style={delay(570)}
      >
        <Link
          className="group sheen inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
          href={content.ctaPrimaryLink || "/products"}
        >
          {content.ctaPrimaryText || "Shop All Products"}
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
    </>
  );
}

/** Editor-controlled claims, closing the section as quiet metadata. */
function TrustStrip({ content }: { content: HomepageContentData }) {
  if (!content.highlights?.length) {
    return null;
  }

  return (
    <div className="relative border-y border-border/70 bg-background/70">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/45 to-transparent"
      />
      <ul className="mx-auto grid max-w-7xl gap-y-6 px-6 py-7 sm:grid-cols-3 sm:divide-x sm:divide-border/60">
        {content.highlights.map((item, idx) => {
          const HighlightIcon = HIGHLIGHT_ICONS[item.icon] ?? Sparkle;
          return (
            <li
              className="intro group flex items-center gap-3.5 sm:justify-center sm:px-4"
              key={item.title}
              style={delay(900 + idx * 90)}
            >
              {/* The icon sits in a champagne ring, so the row reads as three
                  deliberate marks rather than loose text. */}
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold-subtle/40 text-primary-soft transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-gold/70 group-hover:bg-gold-subtle group-hover:text-gold-foreground">
                <HighlightIcon size={18} weight="light" />
              </span>
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
  );
}

/**
 * The homepage opening. With a clip configured the footage carries the whole
 * section; without one the acrylic organizer is rendered in 3D instead, so the
 * page never waits on an asset.
 */
export function Hero({
  content,
  secondaryCtaLink,
  secondaryCtaText,
}: HeroProps) {
  const video = content.heroVideoUrl?.trim();
  const poster = content.heroVideoPoster?.trim();

  if (video) {
    return (
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="absolute inset-0">
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

          {/* Shown in place of the clip when the viewer prefers reduced
              motion, so the section keeps its picture without moving. */}
          {poster && (
            <div
              className="hero-still absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${poster})` }}
            />
          )}

          {/* Scrims. The footage is bright, so the type is kept legible by
              lifting the page colour back over it rather than darkening it —
              and the white is pooled behind the copy rather than spread over
              the whole frame, so the clip still reads as a clip. */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              background:
                "radial-gradient(120% 44% at 50% 26%, var(--background) 0%, color-mix(in oklch, var(--background) 86%, transparent) 55%, transparent 88%), linear-gradient(180deg, color-mix(in oklch, var(--background) 72%, transparent) 0%, color-mix(in oklch, var(--background) 40%, transparent) 62%, color-mix(in oklch, var(--background) 18%, transparent) 100%)",
            }}
          />
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "radial-gradient(56% 74% at 18% 50%, var(--background) 0%, color-mix(in oklch, var(--background) 84%, transparent) 44%, transparent 74%), linear-gradient(90deg, color-mix(in oklch, var(--background) 58%, transparent) 0%, color-mix(in oklch, var(--background) 26%, transparent) 46%, transparent 74%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[min(86vh,42rem)] max-w-7xl flex-col justify-center px-6 py-20 text-center md:items-start md:py-28 md:text-left">
          <HeroCopy
            content={content}
            onVideo
            secondaryCtaLink={secondaryCtaLink}
            secondaryCtaText={secondaryCtaText}
          />
        </div>

        <TrustStrip content={content} />
      </section>
    );
  }

  return (
    <section className="grain relative overflow-hidden bg-background">
      {/* One champagne bloom instead of a colour wash — the section opens on
          white, which is the point of the product. A gradient rather than a
          blurred circle, so it has no visible edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(62% 52% at 50% -8%, color-mix(in oklch, var(--gold) 20%, transparent), transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-10 text-center md:pt-24 md:pb-12 lg:pt-28">
        <HeroCopy
          content={content}
          onVideo={false}
          secondaryCtaLink={secondaryCtaLink}
          secondaryCtaText={secondaryCtaText}
        />
      </div>

      <div
        className="intro-media relative px-6 pb-14 md:pb-16"
        style={delay(700)}
      >
        <AcrylicScene />
      </div>

      <TrustStrip content={content} />
    </section>
  );
}
