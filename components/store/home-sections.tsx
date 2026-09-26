import {
  ArrowRight,
  ArrowSquareOut,
  CheckCircle,
  Diamond,
  Plus,
  Ruler,
  SealCheck,
  Stack,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { order, travel } from "@/components/store/motion";

/* ══ 1. How it is made ══════════════════════════════════════════
   Four factual stages. The copy restates what the specifications
   already claim rather than adding new ones. */

const CRAFT_STEPS = [
  {
    icon: Stack,
    title: "Optical-grade sheet",
    body: "Every piece begins as cast acrylic rated for up to 99% light transmission — not the brittle plastic that clouds or yellows within a season.",
  },
  {
    icon: Ruler,
    title: "Cut to the listed size",
    body: "Blanks are cut to the same dimensions the product page publishes, so a drawer measured at home is a drawer that fits.",
  },
  {
    icon: Diamond,
    title: "Diamond-polished edges",
    body: "Edges are diamond-polished and buffed during manufacturing. Nothing in the range needs a warning about sharp corners.",
  },
  {
    icon: SealCheck,
    title: "Measured, then packed",
    body: "Each unit is checked against its published specification, wrapped in protective film and foam-cased before it leaves the facility.",
  },
];

export function CraftProcess() {
  return (
    <section className="grain relative overflow-hidden border-y border-border/70 bg-primary-wash/40">
      <div
        aria-hidden
        className="parallax pointer-events-none absolute -right-28 top-8 size-[24rem] rounded-full bg-gold/10 blur-3xl"
        style={travel("2.5rem", "-2.5rem")}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="reveal-soft max-w-2xl">
          <p className="eyebrow">How it is made</p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
            From cast sheet to polished shelf
          </h2>
          <div aria-hidden className="rule-gold mt-6 w-24" />
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Four stages stand between an acrylic sheet and the piece on your
            countertop. None of them are decorative.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          {/* Hairline threading the markers together on wide screens */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-linear-to-r from-transparent via-gold/40 to-transparent lg:block"
          />

          {CRAFT_STEPS.map((step, idx) => (
            <li className="reveal-item" key={step.title} style={order(idx)}>
              <span className="relative z-2 inline-flex size-12 items-center justify-center rounded-full border border-gold/45 bg-background text-primary-soft shadow-xs">
                <step.icon size={20} weight="light" />
              </span>
              <p className="mt-6 text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
                Step {String(idx + 1).padStart(2, "0")}
              </p>
              <h3 className="display mt-2 text-xl text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ══ 2. Remaining collections ═══════════════════════════════════ */

interface RailCollection {
  description: string | null;
  id: string;
  name: string;
  productCount: number;
  slug: string;
}

export function CollectionRail({
  collections,
}: {
  collections: RailCollection[];
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
      <div className="reveal-soft mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">More lines</p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
            Other Zencino collections
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Each line shares a finish, a scale and a purpose, so pieces bought
          months apart still sit together.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, idx) => (
          <div className="reveal-item" key={collection.id} style={order(idx)}>
            <Link
              className="group card-hover glow-hover sheen sheen-gold relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-7 hover:border-gold/50"
              href={`/collections/${collection.slug}`}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 z-2 h-px bg-linear-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <span className="relative z-2 inline-flex size-11 items-center justify-center rounded-xl bg-primary-wash text-primary-soft transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-gold-subtle group-hover:text-gold-foreground">
                <Stack size={20} weight="light" />
              </span>

              <h3 className="display relative z-2 mt-5 text-xl text-foreground transition-colors duration-300 group-hover:text-primary">
                {collection.name}
              </h3>
              <p className="relative z-2 mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {collection.description ||
                  "A selection chosen to work as a set rather than as separate objects."}
              </p>

              <span className="relative z-2 mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                <span className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
                  {collection.productCount > 0
                    ? `${collection.productCount} ${collection.productCount === 1 ? "piece" : "pieces"}`
                    : "Arriving soon"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-ui text-primary">
                  View line
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    size={12}
                    weight="bold"
                  />
                </span>
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══ 3. Where to buy ════════════════════════════════════════════ */

const DIRECT_POINTS = [
  "A GST invoice issued with every direct order",
  "Complimentary pan-India delivery above ₹999",
  "7-day returns on unopened, undamaged pieces",
  "Order tracking and a saved address book in your account",
];

const AMAZON_POINTS = [
  "Prime-eligible delivery wherever the listing offers it",
  "The Amazon checkout, wallet and returns flow you already use",
  "Verified listings — every link points at the ASIN we publish",
  "Recognisable by the Prime badge on a product card",
];

export function ChannelChoice() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="reveal-soft mx-auto max-w-2xl text-center">
        <p className="eyebrow">Where to buy</p>
        <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
          Two ways to shop Zencino
        </h2>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Both routes carry the same pieces and the same published
          specifications. Pick the checkout you already trust.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Direct — the filled panel, so the house route reads as the default */}
        <div
          className="reveal-item grain relative overflow-hidden rounded-3xl bg-primary p-9 text-primary-foreground md:p-11"
          style={order(0)}
        >
          <div
            aria-hidden
            className="-right-20 -top-16 pointer-events-none absolute size-[18rem] rounded-full bg-gold/12 blur-3xl"
          />

          <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-primary-foreground/10 text-gold">
            <Storefront size={20} weight="light" />
          </span>
          <p className="relative mt-6 text-2xs font-bold uppercase tracking-eyebrow text-gold">
            Direct
          </p>
          <h3 className="display relative mt-2 text-2xl text-primary-foreground md:text-[1.75rem]">
            Order from Zencino
          </h3>

          <ul className="relative mt-7 space-y-3.5">
            {DIRECT_POINTS.map((point) => (
              <li
                className="flex gap-3 text-sm leading-relaxed text-primary-foreground/80"
                key={point}
              >
                <CheckCircle
                  className="mt-0.5 shrink-0 text-gold"
                  size={16}
                  weight="fill"
                />
                {point}
              </li>
            ))}
          </ul>

          <Link
            className="group sheen relative mt-9 inline-flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-gold-foreground transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105"
            href="/products"
          >
            Shop the catalog
            <ArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1.5"
              size={14}
              weight="bold"
            />
          </Link>
        </div>

        {/* Amazon — the same claims, stated as plainly */}
        <div
          className="reveal-item relative overflow-hidden rounded-3xl border border-gold/45 bg-gold-subtle/40 p-9 md:p-11"
          style={order(1)}
        >
          <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-background text-gold-foreground shadow-xs">
            <ArrowSquareOut size={20} weight="light" />
          </span>
          <p className="relative mt-6 text-2xs font-bold uppercase tracking-eyebrow text-primary-soft">
            Marketplace
          </p>
          <h3 className="display relative mt-2 text-2xl text-foreground md:text-[1.75rem]">
            Buy on Amazon India
          </h3>

          <ul className="relative mt-7 space-y-3.5">
            {AMAZON_POINTS.map((point) => (
              <li
                className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                key={point}
              >
                <CheckCircle
                  className="mt-0.5 shrink-0 text-primary-soft"
                  size={16}
                  weight="fill"
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="relative mt-9 flex flex-wrap items-center gap-6">
            <Link
              className="group sheen sheen-gold inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-background px-7 py-3.5 text-xs font-bold uppercase tracking-ui text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
              href="/products"
            >
              Find the listings
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1.5"
                size={14}
                weight="bold"
              />
            </Link>
            <Link
              className="link-underline text-xs font-bold uppercase tracking-ui text-foreground/70 transition-colors hover:text-primary"
              href="/faq"
            >
              How Amazon orders work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ 4. Questions ═══════════════════════════════════════════════
   Native disclosure elements, so the accordion needs no client
   component and works before hydration. */

export function HomeFaq({ items }: { items: Array<{ q: string; a: string }> }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="reveal-soft lg:col-span-4">
          <p className="eyebrow">Before you order</p>
          <h2 className="display mt-3 text-3xl text-foreground md:text-[2.75rem]">
            Questions, answered plainly
          </h2>
          <div aria-hidden className="rule-gold mt-6 w-24" />
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Care, delivery, Amazon orders and returns — the answers customers
            ask for most, without the marketing detour.
          </p>
          <Link
            className="group link-underline mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-ui text-primary"
            href="/faq"
          >
            Read every answer
            <ArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1"
              size={12}
              weight="bold"
            />
          </Link>
        </div>

        <div className="lg:col-span-8">
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
            {items.map((item) => (
              <details className="faq-item group" key={item.q}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 transition-colors duration-300 hover:bg-primary-wash/40 md:px-8">
                  <span className="font-heading font-medium text-[0.9375rem] text-foreground leading-snug transition-colors duration-300 group-open:text-primary">
                    {item.q}
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-primary-soft transition-all duration-300 group-open:rotate-45 group-open:border-gold/50 group-open:bg-gold-subtle group-open:text-gold-foreground">
                    <Plus size={12} weight="bold" />
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground md:px-8 md:pr-16">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ 5. Closing invitation ══════════════════════════════════════ */

export function ClosingInvitation() {
  return (
    <section className="grain relative overflow-hidden">
      <div
        aria-hidden
        className="parallax -top-20 pointer-events-none absolute left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
        style={travel("2rem", "-2rem")}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold/45 to-transparent"
      />

      <div className="reveal-soft relative mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <Diamond
          className="glow-breathe mx-auto text-gold"
          size={14}
          weight="fill"
        />
        <h2 className="display mt-7 text-[2.25rem] text-foreground sm:text-5xl">
          Bring a little order home
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Start with one drawer, one shelf or one countertop. Every piece is
          listed with the dimensions it actually has, so the first thing you
          order is the right size.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            className="group sheen inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-ui text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
            href="/products"
          >
            Shop all products
            <ArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1.5"
              size={14}
              weight="bold"
            />
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-xs font-bold uppercase tracking-ui text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-primary"
            href="/contact"
          >
            Talk to our team
          </Link>
        </div>

        <p className="mt-9 text-2xs font-semibold uppercase tracking-ui text-muted-foreground">
          Delivery above ₹999 complimentary · 7-day returns · Dispatched across
          India
        </p>
      </div>
    </section>
  );
}
