import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { StoreShell } from "@/components/store/store-shell";

export const metadata: Metadata = {
  title: "About Zencino - Our Story & Craft",
  description: "Learn about Zencino's mission to bring calm and functional order to everyday living spaces.",
};

export default function AboutPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="border-b border-border pb-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-success mb-2">
            <Sparkle size={14} weight="fill" /> Our Philosophy
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            A little order. A lot of possibility.
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            At Zencino, we believe that an uncluttered environment creates space for clarity, creativity, and calm.
          </p>
        </div>

        <div className="mt-12 space-y-12 text-sm md:text-base leading-relaxed text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Why We Started
            </h2>
            <p>
              Modern living can often feel overwhelmed by small daily clutter — loose pens on a work desk, makeup brushes on a vanity, or kitchen accessories misplaced in drawers. 
            </p>
            <p>
              We founded Zencino with a simple goal: craft durable, minimalist, and crystal-clear organizers that blend seamlessly into any room while making what you need easy to find at a glance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Material & Precision
            </h2>
            <p>
              We focus on premium, optical-grade acrylic that offers up to 99% light transmission. Unlike brittle, yellowing plastics, our acrylic organizers feature diamond-buffed edges for a smooth, glass-like finish that is safe to handle and built to last.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Dual-Channel Flexibility
            </h2>
            <p>
              We believe in meeting customers where they prefer to shop. Whether you order directly through our store or use your existing Amazon Prime account for fast, trusted fulfillment, you get authentic Zencino quality backed by transparent specifications.
            </p>
          </section>

          <div className="pt-8 border-t border-border flex items-center justify-between">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-bold uppercase tracking-ui text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Explore Our Products <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              className="text-xs font-semibold uppercase tracking-ui text-muted-foreground hover:text-foreground"
            >
              Get in Touch →
            </Link>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
