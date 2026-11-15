import type { Metadata } from "next";
import {
  ClosingInvitation,
  EverydayBand,
  HomeFaq,
  HowItWorks,
  type Testimonial,
  Testimonials,
  WhyZencino,
} from "@/components/store/home-sections";
import {
  CategoryPedestals,
  FeaturedRail,
  LuxeCanvas,
  LuxeHero,
  NewArrivalSpotlight,
  OfferBanner,
  TrustBar,
} from "@/components/store/luxe-home";
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
import { getShowcaseCoupon } from "@/lib/commerce/coupons";

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
    { products: latestProducts },
    { data: heroContent },
    { data: faqContent },
    showcaseCoupon,
  ] = await Promise.all([
    // Top level only — sub-categories belong on their parent's page.
    getStorefrontCategoryTiles(),
    // Enough for the product floor to fill its columns without repeating.
    getStorefrontProducts({ pageSize: 25 }),
    getPublishedContent<HomepageContentData>("home", "homepage"),
    getPublishedContent<FaqContentData>("faq", "faq"),
    // Only a live, store-wide code is advertised; none hides the banner.
    getShowcaseCoupon(),
  ]);

  const featuredProducts = latestProducts.slice(0, 8);

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

  return (
    <StoreShell tone="luxe">
      {/* 1–6. The dark emerald showroom: hero, category plinths, featured
          rail, promises, the newest piece and the live offer. */}
      <LuxeCanvas>
        <LuxeHero
          content={heroContent}
          secondaryCtaLink={secondaryCtaLink}
          secondaryCtaText={secondaryCtaText}
        />
        <CategoryPedestals categories={categoryTiles} />
        <FeaturedRail products={latestProducts.slice(0, 10)} />
        <TrustBar content={heroContent} />
        <NewArrivalSpotlight />
        <OfferBanner
          coupon={
            showcaseCoupon && {
              code: showcaseCoupon.code,
              description: showcaseCoupon.description,
              discountType: showcaseCoupon.discountType,
              discountValue: showcaseCoupon.discountValue,
              minOrderMinor: showcaseCoupon.minOrderMinor,
            }
          }
        />
      </LuxeCanvas>

      {/* Leaves the showroom on the same curve the bands further down use. */}
      <WaveEdge className="text-primary" side="bottom" />

      {/* 4. How buying works, for any product */}
      <HowItWorks />

      {/* 5. The page's dark anchor */}
      <EverydayBand image={featuredProducts[0]?.primaryImage} />

      {/* 6. The reasons behind the range, on the light ground between bands */}
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
