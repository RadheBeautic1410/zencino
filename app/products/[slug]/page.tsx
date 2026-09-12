import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailView } from "@/components/store/product-detail-view";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontProductBySlug } from "@/lib/catalog/storefront";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getStorefrontProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found - Zencino" };
  }

  const title = product.seoTitle || `${product.name} | Zencino`;
  const description = product.seoDescription || product.description.slice(0, 160);
  const primaryImg = product.media[0]?.url;

  return {
    title,
    description,
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

  // Generate JSON-LD Schema
  const minPrice = product.variants.reduce(
    (min, v) => (v.priceMinor && (min === null || v.priceMinor < min) ? v.priceMinor : min),
    null as number | null
  );

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.media.map((m) => m.url),
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: minPrice ? (minPrice / 100).toFixed(2) : undefined,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <StoreShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />
    </StoreShell>
  );
}
