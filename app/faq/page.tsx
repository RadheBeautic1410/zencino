import type { Metadata } from "next";
import Link from "next/link";
import { StoreShell } from "@/components/store/store-shell";
import {
  type FaqContentData,
  getPublishedContent,
} from "@/lib/commerce/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Zencino",
  description:
    "Find answers to common questions about ordering, Amazon purchasing, acrylic care, and shipping.",
};

export default async function FAQPage() {
  const { data } = await getPublishedContent<FaqContentData>("faq", "faq");

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
            {data.eyebrow || "Help & Information"}
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {data.title || "Frequently Asked Questions"}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {data.subtitle ||
              "Everything you need to know about shopping with Zencino, product care, and shipping."}
          </p>
        </div>

        <div className="mt-12 divide-y divide-border">
          {(data.items || []).map((faq, idx) => (
            <div key={idx} className="py-6 space-y-2">
              <h3 className="text-base font-bold text-foreground">{faq.q}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <h3 className="text-base font-bold">Have a question not answered here?</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Our support team is happy to assist you with any custom questions or guidance.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-ui text-primary-foreground mt-2"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
