import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailView } from "@/components/store/product-detail-view";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontProductBySlug } from "@/lib/catalog/storefront";
import { env } from "@/lib/env";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getStorefrontProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  // The root layout's title template appends " | Zencino"; drop a brand suffix
  // already present in the SEO title so it is not repeated.
  const title = (product.seoTitle || product.name).replace(
    /\s*[|–-]\s*Zencino\s*$/i,
    ""
  );
  const description =
    product.seoDescription || product.description.slice(0, 160);
  const primaryImg = product.media.find((m) => !m.isVideo)?.url;

  return {
    title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title,
      description,
      images: primaryImg ? [{ url: primaryImg }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImg ? [primaryImg] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const { product, redirectUrl } = await getStorefrontProductBySlug(slug);

  if (redirectUrl) {
    permanentRedirect(redirectUrl);
  }

  if (!product) {
    notFound();
  }

  const jsonLd = buildProductJsonLd(product, slug);

  return (
    <StoreShell>
      {jsonLd.map((data) => (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data serialized from our own catalog record.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, "\\u003c"),
          }}
          key={data["@type"]}
          type="application/ld+json"
        />
      ))}
      <ProductDetailView product={product} />
    </StoreShell>
  );
}

type StorefrontProduct = NonNullable<
  Awaited<ReturnType<typeof getStorefrontProductBySlug>>["product"]
>;

// Mirrors the shipping and return settings registered in Merchant Center so
// the page markup and the feed never disagree.
const FREE_SHIPPING_FROM_MINOR = 99_900;
const shippingRupees = (priceMinor: number, weightG: number | null) => {
  if (priceMinor >= FREE_SHIPPING_FROM_MINOR) {
    return 0;
  }
  if (!weightG) {
    return null;
  }
  if (weightG <= 1000) {
    return 100;
  }
  return weightG <= 2000 ? 200 : 300;
};

function buildProductJsonLd(product: StorefrontProduct, slug: string) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://zencino.com";
  const absolute = (url: string) =>
    url.startsWith("http") ? url : `${baseUrl}${url}`;
  const url = `${baseUrl}/products/${slug}`;

  // Cheapest website-sellable variant, matching what the Merchant feed lists.
  const sellable = product.variants
    .filter((v) => v.websiteEnabled && v.priceMinor)
    .sort((a, b) => (a.priceMinor as number) - (b.priceMinor as number));
  const cheapest = sellable[0];

  const offer = cheapest
    ? (() => {
        const price = cheapest.priceMinor as number;
        const shipping = shippingRupees(price, cheapest.weightG);
        return {
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: (price / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Zencino" },
          ...(shipping === null
            ? {}
            : {
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingRate: {
                    "@type": "MonetaryAmount",
                    value: shipping,
                    currency: "INR",
                  },
                  shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: "IN",
                  },
                  deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: {
                      "@type": "QuantitativeValue",
                      minValue: 1,
                      maxValue: 2,
                      unitCode: "DAY",
                    },
                    transitTime: {
                      "@type": "QuantitativeValue",
                      minValue: 3,
                      maxValue: 7,
                      unitCode: "DAY",
                    },
                  },
                },
              }),
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 7,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
          },
        };
      })()
    : undefined;

  const productLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description.replace(/\s+/g, " ").slice(0, 5000),
    url,
    image: product.media.filter((m) => !m.isVideo).map((m) => absolute(m.url)),
    sku: cheapest?.sku ?? product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Zencino" },
    ...(product.category ? { category: product.category.name } : {}),
    ...(offer ? { offers: offer } : {}),
  };

  const breadcrumbs = [
    { name: "Home", item: baseUrl },
    { name: "Products", item: `${baseUrl}/products` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            item: `${baseUrl}/categories/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, item: url },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...crumb,
    })),
  };

  return [productLd, breadcrumbLd];
}
