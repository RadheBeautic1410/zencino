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
    <article className="group relative flex flex-col border border-border bg-background transition-all hover:border-foreground/40 hover:shadow-sm">
      {/* Thumbnail Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-muted/30"
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.primaryImageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground/40">
            <Package size={48} />
          </div>
        )}

        {/* Discount Badge */}
        {discountPct && (
          <span className="absolute top-3 left-3 bg-success px-2 py-0.5 text-2xs font-bold uppercase tracking-ui text-success-foreground">
            {discountPct}% OFF
          </span>
        )}

        {/* Channels Pill */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {product.hasAmazonChannel && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-ui text-black shadow-xs">
              Amazon <ArrowSquareOut size={10} />
            </span>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="flex flex-1 flex-col p-5">
        {product.primaryCategoryName && (
          <p className="text-2xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
            {product.primaryCategoryName}
          </p>
        )}

        <h3 className="font-bold text-sm leading-snug line-clamp-2">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Price & Variant count */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-border/60">
          <div>
            {price !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-base">₹{price.toLocaleString("en-IN")}</span>
                {mrp && mrp > price && (
                  <span className="text-xs text-muted-foreground line-through">
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
            className="rounded border border-border bg-secondary/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-ui text-foreground hover:bg-secondary transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
