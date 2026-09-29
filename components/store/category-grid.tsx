import { ArrowRight, Package } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { order } from "@/components/store/motion";
import { SectionHeading } from "@/components/store/section-heading";

export interface CategoryTile {
  description: string;
  id: string;
  image: string | null;
  imageAlt: string;
  name: string;
  productCount: number;
  slug: string;
}

/**
 * Top-level shelves as a four-up row of picture cards: photograph above, name
 * and one line of description below, each card its own link.
 */
export function CategoryGrid({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="Curated spaces"
        linkHref="/products"
        linkLabel="View all categories"
        title="Explore by category"
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.slice(0, 8).map((category, idx) => (
          <article
            className="reveal-item group card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card hover:border-primary/25"
            key={category.id}
            style={order(idx % 4)}
          >
            <Link
              className="sheen relative block aspect-4/3 overflow-hidden bg-muted/25"
              href={`/categories/${category.slug}`}
            >
              {category.image ? (
                <Image
                  alt={category.imageAlt}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  src={category.image}
                />
              ) : (
                <div className="grid size-full place-items-center text-muted-foreground/30">
                  <Package size={40} />
                </div>
              )}

              <span className="absolute right-3 bottom-3 z-2 grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight size={13} weight="bold" />
              </span>
            </Link>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-heading text-base font-medium text-foreground transition-colors group-hover:text-primary">
                {category.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {category.description ||
                  `${category.productCount} ${
                    category.productCount === 1 ? "piece" : "pieces"
                  } in this range.`}
              </p>

              <Link
                className="mt-5 inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-ui text-foreground transition-colors hover:text-primary"
                href={`/categories/${category.slug}`}
              >
                Shop now
                <ArrowRight
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  size={11}
                  weight="bold"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
