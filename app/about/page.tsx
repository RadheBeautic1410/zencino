import { ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { StoreShell } from "@/components/store/store-shell";
import {
  type AboutContentData,
  getPublishedContent,
} from "@/lib/commerce/content";

export const metadata: Metadata = {
  title: "About Zencino - Our Story & Craft",
  description:
    "Learn about Zencino's mission to bring calm and functional order to everyday living spaces.",
};

export default async function AboutPage() {
  const { data } = await getPublishedContent<AboutContentData>(
    "about",
    "about"
  );

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="border-b border-border pb-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-success mb-2">
            <Sparkle size={14} weight="fill" />{" "}
            {data.eyebrow || "Our Philosophy"}
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {data.headline || "A little order. A lot of possibility."}
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            {data.lead ||
              "At Zencino, we believe that an uncluttered environment creates space for clarity, creativity, and calm."}
          </p>
        </div>

        <div className="mt-12 space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
          {(data.sections || []).map((sec) => (
            <section className="space-y-4" key={sec.heading}>
              <h2 className="text-2xl font-bold text-foreground">
                {sec.heading}
              </h2>
              <p>{sec.body}</p>
            </section>
          ))}

          <div className="pt-8 border-t border-border flex items-center justify-between">
            <Link
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 transition-colors"
              href="/products"
            >
              Explore Our Products <ArrowRight size={14} />
            </Link>
            <Link
              className="text-xs font-semibold uppercase tracking-ui text-muted-foreground hover:text-foreground"
              href="/contact"
            >
              Get in Touch →
            </Link>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
