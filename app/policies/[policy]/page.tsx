import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreShell } from "@/components/store/store-shell";
import {
  DEFAULT_POLICIES,
  getPublishedContent,
  type PolicyContentData,
} from "@/lib/commerce/content";

interface Props {
  params: Promise<{ policy: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { policy } = await params;
  const { data } = await getPublishedContent<PolicyContentData>(
    `policies-${policy}`,
    "policy"
  );
  if (!data?.title) {
    return { title: "Policy Not Found - Zencino" };
  }
  return {
    title: `${data.title} - Zencino Policies`,
    description: data.subtitle,
  };
}

export default async function PolicyPage({ params }: Props) {
  const { policy } = await params;

  if (!["shipping", "returns", "privacy", "terms"].includes(policy)) {
    notFound();
  }

  const { data } = await getPublishedContent<PolicyContentData>(
    `policies-${policy}`,
    "policy"
  );

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link className="hover:text-foreground" href="/">
            Home
          </Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-foreground">{data.title}</span>
        </nav>

        <div className="border-b border-border pb-8">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {data.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {(data.content || []).map((item) => (
            <section className="space-y-3" key={item.heading}>
              <h2 className="text-lg font-bold text-foreground">
                {item.heading}
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Other Policies:</span>
          {Object.entries(DEFAULT_POLICIES)
            .filter(([key]) => key !== policy)
            .map(([key, val]) => (
              <Link
                className="underline hover:text-foreground"
                href={`/policies/${key}`}
                key={key}
              >
                {val.title}
              </Link>
            ))}
        </div>
      </div>
    </StoreShell>
  );
}
