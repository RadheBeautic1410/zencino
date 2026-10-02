import {
  ArrowRight,
  ArrowsClockwise,
  Diamond,
  MapPinLine,
  Plus,
  Ruler,
  SealCheck,
  Sparkle,
  Stack,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { order, travel } from "@/components/store/motion";
import { TestimonialRail } from "@/components/store/testimonial-rail";
import { WaveEdge } from "@/components/store/wave-edge";

/* ══ 1. How it is made ══════════════════════════════════════════
   Four factual stages. The copy restates what the specifications
   already claim rather than adding new ones. */

interface CraftStep {
  body: string;
  icon: typeof Stack;
  /**
   * Photograph of the stage. Drop a file in `public/craft/` and point this at
   * it — until then the card draws its own tinted panel, so the section never
   * waits on an asset and never shows a broken image.
   */
  image: string | null;
  title: string;
}

const CRAFT_STEPS: CraftStep[] = [
  {
    icon: Stack,
    image: "/craft/optical-sheet.svg",
    title: "Optical-grade sheet",
    body: "Premium cast acrylic rated for up to 99% light transmission — it will not cloud or yellow within a season.",
  },
  {
    icon: Ruler,
    image: "/craft/cut-to-size.svg",
    title: "Cut to the listed size",
    body: "Blanks are cut to the exact dimensions published on the product page, so a drawer measured at home fits.",
  },
  {
    icon: Diamond,
    image: "/craft/polished-edge.svg",
    title: "Diamond-polished edges",
    body: "Edges are diamond-polished and buffed for a smooth, premium finish that needs no warning label.",
  },
  {
    icon: SealCheck,
    image: "/craft/measured-packed.svg",
    title: "Measured, then packed",
    body: "Each unit is checked against its specification, then protected and foam-cased before dispatch.",
  },
];

/** The tinted panel a stage falls back to while it has no photograph. */
function CraftPanel({ step }: { step: CraftStep }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-br from-primary-wash via-background to-gold-subtle"
      />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-gold/30 transition-transform duration-700 ease-out group-hover:scale-105"
      >
        <step.icon size={52} weight="thin" />
      </span>
    </>
  );
}

export function CraftProcess() {
  return (
    <section
      className="grain relative overflow-hidden border-y border-border/60 bg-primary-wash/40"
      id="process"
    >
      <div
        aria-hidden
        className="parallax pointer-events-none absolute -right-28 top-8 size-96 rounded-full bg-gold/10 blur-3xl"
        style={travel("2.5rem", "-2.5rem")}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-20 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
        <div className="reveal-soft lg:pt-2">
          <p className="text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
            How it is made
          </p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.5rem]">
            From cast sheet to polished shelf
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Four stages stand between an acrylic sheet and the piece on your
            countertop. None of them are decorative.
          </p>
          <Link
            className="group sheen mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-ui text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            href="/about"
          >
            Explore our process
            <ArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1.5"
              size={13}
              weight="bold"
            />
          </Link>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {CRAFT_STEPS.map((step, idx) => (
            <li
              className="reveal-item relative"
              key={step.title}
              style={order(idx)}
            >
              {/* The connector hangs off the item so it can cross the gutter
                  while the card below clips its own picture. */}
              {idx > 0 && (
                <span
                  aria-hidden
                  className="-left-4 absolute top-24 hidden text-muted-foreground/40 lg:block"
                >
                  <ArrowRight size={14} weight="bold" />
                </span>
              )}

              <p className="display text-2xl text-muted-foreground/35">
                {String(idx + 1).padStart(2, "0")}
              </p>

              <div className="group relative mt-3 aspect-4/3 overflow-hidden rounded-xl border border-border/60 bg-primary-wash">
                {step.image ? (
                  <Image
                    alt=""
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
                    src={step.image}
                    /* The optimizer rejects SVG unless `dangerouslyAllowSVG`
                       is on, and these drawn stages are vector. A photograph
                       dropped in later is optimized as usual. */
                    unoptimized={step.image.endsWith(".svg")}
                  />
                ) : (
                  <CraftPanel step={step} />
                )}

                <span className="absolute bottom-3 left-3 z-2 grid size-8 place-items-center rounded-lg bg-background/90 text-primary-soft shadow-xs">
                  <step.icon size={15} weight="light" />
                </span>
              </div>

              <h3 className="mt-4 font-heading text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ══ 2. The calm band ═══════════════════════════════════════════
   The page's dark anchor: the argument for the product, with the
   three numbers that support it. */

const CALM_STATS = [
  { label: "Happy customers", value: "20K+" },
  { label: "Average rating", value: "4.8★" },
  { label: "Premium acrylic", value: "100%" },
];

export function CalmBand({ image }: { image?: string | null }) {
  return (
    <section className="relative text-primary">
      <WaveEdge side="top" />

      <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="parallax pointer-events-none absolute -left-32 bottom-0 size-128 rounded-full bg-gold/10 blur-3xl"
          style={travel("3rem", "-3rem")}
        />

        <div className="relative grid items-stretch lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="reveal-soft flex flex-col justify-center px-6 py-16 sm:px-10 md:py-20 lg:pr-14 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
            <p className="text-2xs font-bold uppercase tracking-eyebrow text-gold">
              A calmer space
            </p>
            <h2 className="display mt-4 text-3xl text-primary-foreground md:text-[2.5rem]">
              Clarity meets calm
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/75 md:text-base">
              A clean space does more than look good — it helps you think
              clearer, feel lighter and focus on what matters.
            </p>

            <Link
              className="group sheen sheen-gold mt-8 inline-flex w-fit items-center gap-2.5 rounded-full bg-primary-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-ui text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-gold-foreground"
              href="/about"
            >
              Our story
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                size={13}
                weight="bold"
              />
            </Link>

            <dl className="mt-12 flex flex-wrap items-start gap-x-10 gap-y-6 border-t border-primary-foreground/15 pt-8">
              {CALM_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="display block text-2xl text-primary-foreground">
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block text-2xs text-primary-foreground/60">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-72 overflow-hidden lg:min-h-112">
            {image ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={image}
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 bg-linear-to-br from-primary-foreground/10 via-gold/10 to-transparent"
              />
            )}

            {/* The seal in the corner, the way a maker's mark sits on a print. */}
            <span className="absolute top-8 right-8 hidden size-28 flex-col items-center justify-center gap-1.5 rounded-full bg-primary/70 p-4 text-center backdrop-blur-sm md:flex">
              <span className="text-3xs font-semibold leading-tight text-primary-foreground/85">
                Designed for everyday beauty
              </span>
              <ArrowRight className="text-gold" size={13} weight="bold" />
            </span>
          </div>
        </div>
      </div>

      <WaveEdge side="bottom" />
    </section>
  );
}

/* ══ 3. Before and after ════════════════════════════════════════ */

interface ClutterToClarityProps {
  afterImage?: string | null;
  beforeImage?: string | null;
}

/** One half of the comparison — its own picture, its own chip. */
function ComparePane({
  alt,
  image,
  label,
  tone,
}: {
  alt: string;
  image?: string | null;
  label: string;
  tone: "after" | "before";
}) {
  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
      {image ? (
        <Image
          alt={alt}
          className="object-cover"
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          src={image}
        />
      ) : (
        <span
          aria-hidden
          className={`absolute inset-0 ${
            tone === "before"
              ? "bg-linear-to-br from-muted via-background to-muted"
              : "bg-linear-to-br from-primary-wash via-background to-gold-subtle"
          }`}
        />
      )}

      <span
        className={`absolute top-4 left-4 z-2 rounded-full px-3.5 py-1.5 text-2xs font-bold uppercase tracking-ui ${
          tone === "before"
            ? "bg-background/90 text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function ClutterToClarity({
  afterImage,
  beforeImage,
}: ClutterToClarityProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
        <div className="reveal-soft lg:pt-6">
          <p className="text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
            Real spaces, real difference
          </p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.5rem]">
            From clutter to clarity
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            See how a single organizer changes the way a drawer, a desk or a
            countertop works for you.
          </p>
        </div>

        <div className="reveal-media relative grid grid-cols-2 gap-4 sm:gap-6">
          <ComparePane
            alt="A cluttered surface before a Zencino organizer"
            image={beforeImage}
            label="Before"
            tone="before"
          />
          <ComparePane
            alt="The same surface sorted into a Zencino acrylic organizer"
            image={afterImage}
            label="After"
            tone="after"
          />

          {/* The handle straddles the gutter, reading as one comparison. */}
          <span
            aria-hidden
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-2 grid size-10 place-items-center rounded-full bg-background text-foreground shadow-lg"
          >
            <ArrowRight size={15} weight="bold" />
          </span>
        </div>
      </div>
    </section>
  );
}

/* ══ 4. Why choose Zencino ══════════════════════════════════════ */

const REASONS = [
  {
    icon: Diamond,
    title: "99% optical clarity",
    body: "Crystal-clear finish that lasts.",
  },
  {
    icon: ArrowsClockwise,
    title: "7 days replacement",
    body: "Hassle-free returns.",
  },
  {
    icon: Sparkle,
    title: "100% premium acrylic",
    body: "No yellowing, no brittleness.",
  },
  {
    icon: MapPinLine,
    title: "Made in India",
    body: "Supporting local craftsmanship.",
  },
];

export function WhyZencino() {
  return (
    <section className="relative text-primary">
      <WaveEdge side="top" />

      <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="parallax pointer-events-none absolute -right-28 top-0 size-112 rounded-full bg-gold/10 blur-3xl"
          style={travel("2.5rem", "-2.5rem")}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-20 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
          <div className="reveal-soft lg:pt-4">
            <p className="text-2xs font-bold uppercase tracking-eyebrow text-gold">
              Why choose Zencino
            </p>
            <h2 className="display mt-3 text-3xl text-primary-foreground md:text-[2.5rem]">
              More than just organizers
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/75">
              Thoughtful design, premium materials and a commitment to quality —
              in every piece.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason, idx) => (
              <li
                className="reveal-item group card-hover rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-sm hover:border-gold/45"
                key={reason.title}
                style={order(idx)}
              >
                <reason.icon
                  className="text-gold transition-transform duration-500 group-hover:-translate-y-0.5"
                  size={22}
                  weight="light"
                />
                <h3 className="mt-5 font-heading text-sm font-semibold leading-snug text-primary-foreground">
                  {reason.title}
                </h3>
                <p className="mt-2 text-2xs leading-relaxed text-primary-foreground/70">
                  {reason.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <WaveEdge side="bottom" />
    </section>
  );
}

/* ══ 5. Testimonials ════════════════════════════════════════════ */

export interface Testimonial {
  author: string;
  id: string;
  image?: string | null;
  quote: string;
  rating: number;
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) {
    return null;
  }

  const average =
    items.reduce((sum, item) => sum + item.rating, 0) / items.length;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <TestimonialRail average={average} items={items} />
    </section>
  );
}

/* ══ 6. Questions asked before ordering ═════════════════════════ */

export function HomeFaq({ items }: { items: Array<{ a: string; q: string }> }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative text-primary">
      <WaveEdge side="top" />

      <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
        {/* Light from above, the way it falls through the material. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(52% 56% at 50% 0%, color-mix(in oklch, var(--gold) 14%, transparent), transparent 72%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-20 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-14">
          <div className="reveal-soft lg:pt-4">
            <p className="text-2xs font-bold uppercase tracking-eyebrow text-gold">
              Questions, answered
            </p>
            <h2 className="display mt-3 text-3xl text-primary-foreground md:text-[2.5rem]">
              Frequently asked questions
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/75">
              Everything you need to know about our products, shipping and
              returns.
            </p>
            <Link
              className="group sheen sheen-gold mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-ui text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-gold-foreground"
              href="/faq"
            >
              View all FAQs
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                size={13}
                weight="bold"
              />
            </Link>
          </div>

          {/* `details` keeps the accordion working without a line of JavaScript. */}
          <div className="reveal-soft divide-y divide-primary-foreground/12 overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur-sm">
            {items.map((item) => (
              <details className="group px-5 py-4 sm:px-6" key={item.q}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium text-primary-foreground transition-colors hover:text-gold">
                  {item.q}
                  <Plus
                    className="shrink-0 text-primary-foreground/55 transition-transform duration-300 group-open:rotate-45 group-hover:text-gold"
                    size={15}
                    weight="bold"
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-xs leading-relaxed text-primary-foreground/70">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <WaveEdge side="bottom" />
    </section>
  );
}

/* ══ 7. Closing invitation ══════════════════════════════════════ */

export function ClosingInvitation({ image }: { image?: string | null }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {image ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="100vw"
            src={image}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-br from-primary-wash via-background to-gold-subtle"
          />
        )}
        {/* The type has to hold over whatever photograph is dropped in. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-page/72 via-page/72 via-72% to-page backdrop-blur-[1px]"
        />
      </div>

      <div className="reveal-soft relative mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <p className="text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
          Bring order home
        </p>
        <h2 className="display mt-4 text-3xl text-foreground md:text-[2.75rem]">
          Simple. Stylish. Organized.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Discover premium acrylic organizers for every space in your home.
        </p>
        <Link
          className="group sheen mt-9 inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          href="/products"
        >
          Shop collection
          <ArrowRight
            className="transition-transform duration-300 group-hover:translate-x-1.5"
            size={13}
            weight="bold"
          />
        </Link>
      </div>
    </section>
  );
}
