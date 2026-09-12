import type { Metadata } from "next";
import Link from "next/link";
import { StoreShell } from "@/components/store/store-shell";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Zencino",
  description: "Find answers to common questions about ordering, Amazon purchasing, acrylic care, and shipping.",
};

const faqs = [
  {
    q: "Can I buy Zencino products on Amazon?",
    a: "Yes! Every Zencino product variant listed with Amazon availability features a direct 'Buy on Amazon' button that routes you to the verified product ASIN on Amazon India. You can use your Amazon Prime membership for speedy delivery and familiar checkout.",
  },
  {
    q: "How do I care for and clean acrylic organizers?",
    a: "Always clean acrylic with a soft, clean microfiber cloth and lukewarm water with mild dish soap. Never use window cleaners containing ammonia (such as Windex), rubbing alcohol, acetone, or abrasive scrubbers, as these can cloud or scratch the crystal-clear finish.",
  },
  {
    q: "Where are Zencino products shipped from?",
    a: "All Zencino direct orders are dispatched from our central fulfilment facility in India using verified courier networks with door-to-door tracking.",
  },
  {
    q: "What is your return policy?",
    a: "For orders placed on Amazon, Amazon's standard return policy applies. For direct website purchases, we offer a 7-day return window for unopened and undamaged items in their original protective packaging.",
  },
  {
    q: "Are the edges of your acrylic organizers sharp?",
    a: "No. All Zencino acrylic items undergo precision diamond-polishing and edge-buffing during manufacturing, ensuring smooth, safe edges that are comfortable to handle daily.",
  },
  {
    q: "Do you offer bulk or corporate gifting discounts?",
    a: "Yes! If you are ordering 25+ units for office setups, styling projects, or corporate gifts, please contact us via our Contact page for bulk pricing.",
  },
];

export default function FAQPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
            Help & Information
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Everything you need to know about shopping with Zencino, product care, and shipping.
          </p>
        </div>

        <div className="mt-12 divide-y divide-border">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-6 space-y-2">
              <h3 className="text-base font-bold text-foreground">
                {faq.q}
              </h3>
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
