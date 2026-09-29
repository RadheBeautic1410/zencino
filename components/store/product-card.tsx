import { Package, ShoppingBagOpen, Star } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    primaryCategoryName: string | null;
    hasWebsiteChannel: boolean;
    hasAmazonChannel: boolean;
    minPriceMinor: number | null;
    maxMrpMinor: number | null;
    variantCount: number;
    primaryImage: string | null;
    primaryImageAlt: string;
    /** Present only once the catalog carries ratings; the row adapts without it. */
    rating?: number | null;
    reviewCount?: number | null;
  };
}

const STAR_POSITIONS = [1, 2, 3, 4, 5];

/** Five marks filled to the nearest half, plus the score as a number. */
function RatingRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {STAR_POSITIONS.map((position) => (
          <Star
            className={
              position <= Math.round(rating)
                ? "text-gold"
                : "text-muted-foreground/25"
            }
            key={position}
            size={12}
            weight="fill"
          />
        ))}
      </span>
      <span className="text-2xs font-semibold text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.minPriceMinor ? product.minPriceMinor / 100 : null;
  const mrp = product.maxMrpMinor ? product.maxMrpMinor / 100 : null;
  const discountPct =
    price && mrp && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : null;
  const href = `/products/${product.slug}`;

  return (
    <article className="group card-hover relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card hover:border-primary/25">
      <div className="relative">
        <Link
          className="sheen relative block aspect-4/3 w-full overflow-hidden bg-muted/25"
          href={href}
        >
          {product.primaryImage ? (
            <Image
              alt={product.primaryImageAlt}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={product.primaryImage}
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground/30 transition-transform duration-700 ease-out group-hover:scale-105">
              <Package size={44} />
            </div>
          )}

          {discountPct && (
            <span className="absolute top-3 left-3 z-2 rounded-full bg-primary/92 px-2.5 py-1 text-3xs font-bold uppercase tracking-ui text-primary-foreground backdrop-blur-xs">
              {discountPct}% off
            </span>
          )}

          {product.hasAmazonChannel && (
            <span className="absolute top-3 right-3 z-2 rounded-full bg-gold px-2.5 py-1 text-3xs font-bold uppercase tracking-ui text-gold-foreground">
              Prime
            </span>
          )}
        </Link>

        {/* Sits on the seam between picture and copy, the way the reference
            card does. It opens the product page, because the variant is
            chosen there — nothing is added to a bag behind the shopper. */}
        <Link
          aria-label={`View ${product.name}`}
          className="absolute -bottom-5 right-4 z-2 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
          href={href}
        >
          <ShoppingBagOpen size={16} weight="bold" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-5">
        <h3 className="line-clamp-2 font-heading text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          <Link href={href}>{product.name}</Link>
        </h3>

        {/* Ratings when the catalog has them, otherwise the shelf the piece
            belongs to — the row keeps its place either way. */}
        <div className="mt-2 min-h-4">
          {product.rating ? (
            <RatingRow rating={product.rating} />
          ) : (
            product.primaryCategoryName && (
              <p className="text-2xs font-semibold uppercase tracking-ui text-primary-soft">
                {product.primaryCategoryName}
              </p>
            )
          )}
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          {price === null ? (
            <span className="text-xs font-medium text-muted-foreground">
              Pricing on request
            </span>
          ) : (
            <>
              <span className="font-heading text-base font-semibold text-foreground">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {mrp && mrp > price && (
                <span className="text-xs text-muted-foreground/70 line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
