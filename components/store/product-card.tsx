import Image from "next/image";
import Link from "next/link";
import { ArrowSquareOut, Package } from "@phosphor-icons/react/dist/ssr";

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
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.minPriceMinor ? product.minPriceMinor / 100 : null;
  const mrp = product.maxMrpMinor ? product.maxMrpMinor / 100 : null;
  const discountPct = price && mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden card-hover transition-all duration-300">
      {/* Thumbnail Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-muted/20"
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.primaryImageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground/30">
            <Package size={48} />
          </div>
        )}

        {/* Discount Badge */}
        {discountPct && (
          <span className="absolute top-3 left-3 rounded-full bg-emerald-700/90 text-white backdrop-blur-xs px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-ui shadow-xs">
            {discountPct}% OFF
          </span>
        )}

        {/* Channels Pill */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {product.hasAmazonChannel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-ui text-amber-950 shadow-xs backdrop-blur-xs">
              Prime <ArrowSquareOut size={10} weight="bold" />
            </span>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="flex flex-1 flex-col p-5">
        {product.primaryCategoryName && (
          <p className="text-2xs font-semibold uppercase tracking-ui text-emerald-800/80 mb-1">
            {product.primaryCategoryName}
          </p>
        )}

        <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          <Link href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h3>

        {/* Price & Variant count */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-border/60">
          <div>
            {price !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-base text-foreground font-heading">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                {mrp && mrp > price && (
                  <span className="text-xs text-muted-foreground/75 line-through">
                    ₹{mrp.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">Pricing on request</span>
            )}
            <p className="text-2xs text-muted-foreground">
              {product.variantCount} {product.variantCount === 1 ? "option" : "options"}
            </p>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="rounded-full bg-primary/10 text-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-ui hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
