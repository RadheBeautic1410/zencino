import type { Metadata } from "next";
import { CategoryGrid } from "@/components/store/category-grid";
import { Hero } from "@/components/store/hero";
import {
  CalmBand,
  ClosingInvitation,
  ClutterToClarity,
  CraftProcess,
  HomeFaq,
  type Testimonial,
  Testimonials,
  WhyZencino,
} from "@/components/store/home-sections";
import { order } from "@/components/store/motion";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { StoreShell } from "@/components/store/store-shell";
import { WaveEdge } from "@/components/store/wave-edge";
import {
  getStorefrontCategoryTiles,
  getStorefrontProducts,
} from "@/lib/catalog/storefront";
import {
  type FaqContentData,
  getPublishedContent,
  type HomepageContentData,
} from "@/lib/commerce/content";

export const metadata: Metadata = {
  title: {
    absolute: "Zencino — Crystal-Clear Acrylic Organizers & Home Essentials",
  },
  description:
    "Diamond-polished optical acrylic organizers for the home, kitchen and workspace. Shop direct with Zencino or through verified Amazon India listings.",
};

/**
 * Photographs for the comparison band. The frames live in `public/home/` so
 * they ship with the build — `public/uploads/` is the runtime upload directory
 * and is untracked, so site assets cannot live there.
 */
const BEFORE_IMAGE: string | null = "/home/before-1.png";
const AFTER_IMAGE: string | null = "/home/after-1.png";

/**
 * PLACEHOLDER REVIEWS — replace every entry with a real, attributable customer
 * review before this page goes live. They are kept in one constant so there is
 * a single place to change, and the section disappears if the list is emptied.
 */
const PLACEHOLDER_TESTIMONIALS: Omit<Testimonial, "image">[] = [
  {
    author: "Sample review — replace",
    id: "t1",
    quote:
      "Amazing quality and looks so premium on my vanity. Totally worth it.",
    rating: 5,
  },
  {
    author: "Sample review — replace",
    id: "t2",
    quote:
      "My kitchen looks so organized now. The clarity and finish is just perfect.",
    rating: 5,
  },
  {
    author: "Sample review — replace",
    id: "t3",
    quote:
      "Sturdy, elegant and super useful. Exactly what I needed for my desk.",
    rating: 5,
  },
];

export default async function HomePage() {
  const [
    categoryTiles,
    { products: featuredProducts },
    { data: heroContent },
    { data: faqContent },
  ] = await Promise.all([
    // Top level only — sub-categories belong on their parent's page.
    getStorefrontCategoryTiles(),
    getStorefrontProducts({ pageSize: 8 }),
    getPublishedContent<HomepageContentData>("home", "homepage"),
    getPublishedContent<FaqContentData>("faq", "faq"),
  ]);

  // A short set here; the FAQ page keeps the full list.
  const faqItems = (faqContent.items || []).slice(0, 4);

  const secondaryCtaLink = heroContent.ctaSecondaryLink || "/products";
  const secondaryCtaText = heroContent.ctaSecondaryText || "Explore categories";

  // The quotes borrow the product each one is about, so the rail is not
  // showing faces the shop does not own.
  const testimonials: Testimonial[] = PLACEHOLDER_TESTIMONIALS.map(
    (item, idx) => ({ ...item, image: featuredProducts[idx]?.primaryImage })
  );

  return (
    <StoreShell>
      {/* 1. Hero — copy against the warm ground, product filling the right */}
      <Hero
        content={heroContent}
        secondaryCtaLink={secondaryCtaLink}
        secondaryCtaText={secondaryCtaText}
      />

      {/* The hero closes on a green claim band, so it leaves on the same curve
          the bands further down use. Shorter than the default — the strip it
          hangs off is thin. */}
      <WaveEdge
        className="h-[clamp(1.75rem,4vw,4rem)] text-primary"
        side="bottom"
      />

      {/* 2. Shelves to browse */}
      <CategoryGrid categories={categoryTiles} />

      {/* 3. What people are actually buying */}
      {featuredProducts.length > 0 && (
        <section className="relative text-primary">
          <WaveEdge side="top" />

          <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
            <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
              <SectionHeading
                eyebrow="Customers' favourites"
                linkHref="/products"
                linkLabel="View all products"
                title="Best selling products"
                tone="dark"
              />

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.slice(0, 4).map((prod, idx) => (
                  <div
                    className="reveal-item h-full"
                    key={prod.id}
                    style={order(idx % 4)}
                  >
                    <ProductCard product={prod} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <WaveEdge side="bottom" />
        </section>
      )}

      {/* 4. How the pieces are made */}
      <CraftProcess />

      {/* 5. The page's dark anchor */}
      <CalmBand image={featuredProducts[0]?.primaryImage} />

      {/* 6. The difference an organizer makes */}
      <ClutterToClarity afterImage={AFTER_IMAGE} beforeImage={BEFORE_IMAGE} />

      {/* 7. The reasons behind the range */}
      <WhyZencino />

      {/* 8. What customers say */}
      <Testimonials items={testimonials} />

      {/* 9. Questions people ask before ordering */}
      <HomeFaq items={faqItems} />

      {/* 10. Closing invitation, handing off to the footer */}
      <ClosingInvitation image={heroContent.heroVideoPoster} />
    </StoreShell>
  );
}
