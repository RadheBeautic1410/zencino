import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { floorColumn } from "@/components/store/motion";
import type { ProductCardProps } from "@/components/store/product-card";
import { RevealWords } from "@/components/store/reveal-words";

type FloorProduct = Pick<
  ProductCardProps["product"],
  "id" | "minPriceMinor" | "name" | "primaryImage" | "primaryImageAlt" | "slug"
>;

const COLUMN_COUNT = 5;
const TILES_PER_COLUMN = 5;
/** Below this the columns repeat the same few pieces too visibly. */
const MIN_PICTURED_PRODUCTS = 4;

/** Each column loops two identical halves, so -50% lands back on the start. */
const LOOP_HALVES = ["a", "b"];

const COLUMNS = Array.from({ length: COLUMN_COUNT }, (_, column) => column);
const ROWS = Array.from({ length: TILES_PER_COLUMN }, (_, row) => row);

function FloorTile({ product }: { product: FloorProduct }) {
  const price = product.minPriceMinor ? product.minPriceMinor / 100 : null;

  return (
    <Link
      className="sheen sheen-gold block overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1.5 hover:ring-2 hover:ring-gold"
      href={`/products/${product.slug}`}
      tabIndex={-1}
    >
      <span className="relative block aspect-4/3 bg-muted/25">
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="(max-width: 640px) 38vw, (max-width: 1024px) 28vw, 24vw"
          src={product.primaryImage ?? ""}
        />
      </span>
      <span className="flex items-center justify-between gap-2 px-3 py-2.5 lg:px-4 lg:py-3">
        <span className="truncate font-heading text-2xs font-medium sm:text-xs lg:text-sm">
          {product.name}
        </span>
        {price !== null && (
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-3xs font-bold text-gold-foreground lg:text-2xs">
            ₹{price.toLocaleString("en-IN")}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * The catalog laid out as a shop floor receding from the viewer: columns of
 * real products drifting in opposite directions, on a plane that lifts upright
 * as the section scrolls through. Pure CSS, so this stays a server component.
 *
 * The moving plane is decorative and hidden from assistive tech. Its tiles stay
 * clickable for pointers, and the link under the heading is the real route in.
 */
export function ProductFloor({ products }: { products: FloorProduct[] }) {
  const pictured = products.filter((product) => product.primaryImage);

  if (pictured.length < MIN_PICTURED_PRODUCTS) {
    return null;
  }

  return (
    <section className="floor grain relative overflow-clip bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="glow-breathe pointer-events-none absolute top-[-8rem] left-1/2 h-96 w-[min(44rem,100vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--gold)_28%,transparent),transparent)]"
      />

      <div className="relative mx-auto max-w-3xl px-6 pt-12 text-center md:pt-16">
        <p className="reveal-soft text-2xs font-bold uppercase tracking-eyebrow text-gold">
          The Zencino floor
        </p>
        <h2 className="reveal-words display mt-4 text-4xl md:text-6xl">
          <RevealWords text="Walk the aisles" />
          <span className="block italic text-gold">
            <RevealWords start={3} text="from your sofa." />
          </span>
        </h2>
        <Link
          className="reveal-soft group mt-7 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-ui"
          href="/products"
        >
          <span className="link-underline pb-1">Browse every aisle</span>
          <ArrowRight
            className="text-gold transition-transform duration-300 group-hover:translate-x-1.5"
            size={13}
            weight="bold"
          />
        </Link>
      </div>

      <div aria-hidden className="floor-stage relative mt-6 md:mt-8">
        <div className="floor-plane">
          {COLUMNS.map((column) => (
            <div
              className="floor-column"
              key={column}
              style={floorColumn(column)}
            >
              {LOOP_HALVES.flatMap((half) =>
                ROWS.map((row) => (
                  <FloorTile
                    key={`${half}-${row}`}
                    product={
                      pictured[
                        (column * TILES_PER_COLUMN + row) % pictured.length
                      ]
                    }
                  />
                ))
              )}
            </div>
          ))}
        </div>

        {/* One slow band of champagne light travelling over the shelves. */}
        <div className="floor-beam" />
      </div>
    </section>
  );
}
