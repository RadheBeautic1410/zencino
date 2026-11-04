import type { Metadata } from "next";
import { CategoryGrid } from "@/components/store/category-grid";
import { Hero } from "@/components/store/hero";
import {
  ClosingInvitation,
  EverydayBand,
  HomeFaq,
  HowItWorks,
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
  alternates: { canonical: "/" },
  title: {
    absolute: "Zencino — Home, Kitchen & Everyday Essentials Online in India",
  },
  description:
    "Useful products for the home, kitchen, desk and kids. Shop direct with Zencino or through verified Amazon India listings, with delivery across India.",
};

/**
 * Add only real, attributable customer reviews here. The section stays hidden
 * while the list is empty.
 */
const CUSTOMER_REVIEWS: Omit<Testimonial, "image">[] = [];

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

  // A short set here; the FAQ page keeps the full list, including the
  // questions that only apply to one material.
  const faqItems = (faqContent.items || [])
    .filter((item) => !/acrylic/i.test(item.q))
    .slice(0, 4);

  const secondaryCtaLink = heroContent.ctaSecondaryLink || "/products";
  const secondaryCtaText = heroContent.ctaSecondaryText || "Explore products";

  // The quotes borrow the product each one is about, so the rail is not
  // showing faces the shop does not own.
  const testimonials: Testimonial[] = CUSTOMER_REVIEWS.map((item, idx) => ({
    ...item,
    image: featuredProducts[idx]?.primaryImage,
  }));

  // The rail below shows the first four, so the hero takes the next ones when
  // there are enough to keep the two from repeating each other.
  const heroProducts =
    featuredProducts.length >= 8
      ? featuredProducts.slice(4, 8)
      : featuredProducts.slice(0, 4);

  return (
    <StoreShell>
      {/* 1. Hero — copy against the warm ground, product filling the right */}
      <Hero
        content={heroContent}
        products={heroProducts}
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

      {/* 3. The newest additions to the range */}
      {featuredProducts.length > 0 && (
        <section className="relative text-primary">
          <WaveEdge side="top" />

          <div className="grain relative overflow-hidden bg-primary text-primary-foreground">
            <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
              <SectionHeading
                eyebrow="Just added"
                linkHref="/products"
                linkLabel="View all products"
                title="New arrivals"
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

      {/* 4. How buying works, for any product */}
      <HowItWorks />

      {/* 5. The page's dark anchor */}
      <EverydayBand image={featuredProducts[0]?.primaryImage} />

      {/* 6. The reasons behind the range */}
      <WhyZencino />

      {/* 7. What customers say */}
      <Testimonials items={testimonials} />

      {/* 8. Questions people ask before ordering */}
      <HomeFaq items={faqItems} />

      {/* 9. Closing invitation, handing off to the footer */}
      <ClosingInvitation image={heroContent.heroVideoPoster} />
    </StoreShell>
  );
}
