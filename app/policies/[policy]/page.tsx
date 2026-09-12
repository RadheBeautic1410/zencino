import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreShell } from "@/components/store/store-shell";

interface Props {
  params: Promise<{ policy: string }>;
}

const POLICY_DATA: Record<
  string,
  { title: string; subtitle: string; content: Array<{ heading: string; body: string }> }
> = {
  shipping: {
    title: "Shipping Policy",
    subtitle: "Transparent delivery times, dispatch promises, and coverage across India.",
    content: [
      {
        heading: "1. Order Processing & Dispatch",
        body: "All in-stock direct website orders are processed and dispatched from our facility within 1 to 2 business days (excluding Sundays and national holidays). Tracking links are issued via email as soon as the carrier registers the package.",
      },
      {
        heading: "2. Delivery Timelines",
        body: "Standard courier delivery across major Indian metro cities typically takes 3 to 5 business days from dispatch. Tier-2 and regional areas may require 5 to 7 business days.",
      },
      {
        heading: "3. Packaging & Fragile Item Care",
        body: "Because our products are crafted from optical-grade acrylic, every unit is individually wrapped with protective film, encased in shock-absorbing foam, and packaged in heavy-duty cardboard cartons to prevent scratches or transit damage.",
      },
      {
        heading: "4. Amazon Orders",
        body: "Orders completed via our 'Buy on Amazon' outbound links are fulfilled according to Amazon India's shipping schedules, including Prime delivery options where available.",
      },
    ],
  },
  returns: {
    title: "Returns & Cancellations",
    subtitle: "Clear policies for cancellations, replacements, and returns.",
    content: [
      {
        heading: "1. Return Window",
        body: "We offer a 7-day return policy from the date of delivery for items in their original, unused condition, complete with original protective film and packaging.",
      },
      {
        heading: "2. Damaged or Defective Items",
        body: "If your acrylic item arrives damaged or broken during transit, please notify our customer support team within 48 hours of delivery with photographic evidence. We will arrange a free replacement immediately.",
      },
      {
        heading: "3. Cancellation Process",
        body: "Orders can be canceled free of charge before they are handed over to the courier. Once dispatched, the standard return procedure applies upon delivery.",
      },
      {
        heading: "4. Amazon Orders",
        body: "Returns for purchases made via Amazon India are managed entirely through your Amazon account under Amazon's standard Return & Refund policies.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How Zencino respects and safeguards your personal data.",
    content: [
      {
        heading: "1. Information We Collect",
        body: "When you interact with our website or create an account, we collect necessary operational details including your name, email address, and shipping address. We do not sell or rent your personal information to third parties.",
      },
      {
        heading: "2. Secure Authentication",
        body: "We use passwordless magic-link authentication to prevent credential leakage. Payment card and sensitive financial information are handled securely by accredited payment gateways and never touch our servers.",
      },
      {
        heading: "3. Amazon Outbound Links",
        body: "When you click 'Buy on Amazon', our website logs an anonymized click event for campaign attribution and redirects you to Amazon. No customer personal identification is transmitted in this redirect.",
      },
      {
        heading: "4. Data Retention & Deletion",
        body: "You can request an export of your account data or request account deletion at any time from your Account Settings page.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Operating terms governing the use of Zencino's website and services.",
    content: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing and using this website, you agree to comply with and be bound by these terms. If you disagree with any part of these terms, please do not use our services.",
      },
      {
        heading: "2. Catalog Accuracy",
        body: "We strive to display product colors, dimensions, and specifications as accurately as possible. However, individual screen settings may cause minor color variances.",
      },
      {
        heading: "3. Pricing & Currency",
        body: "All prices on the website are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.",
      },
      {
        heading: "4. Intellectual Property",
        body: "All text, design, photography, and brand assets on Zencino are the property of Zencino and protected under intellectual property laws.",
      },
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { policy } = await params;
  const data = POLICY_DATA[policy];
  if (!data) return { title: "Policy Not Found - Zencino" };
  return {
    title: `${data.title} - Zencino Policies`,
    description: data.subtitle,
  };
}

export default async function PolicyPage({ params }: Props) {
  const { policy } = await params;
  const data = POLICY_DATA[policy];

  if (!data) {
    notFound();
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
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
          {data.content.map((item, idx) => (
            <section key={idx} className="space-y-3">
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
          {Object.entries(POLICY_DATA)
            .filter(([key]) => key !== policy)
            .map(([key, val]) => (
              <Link
                key={key}
                href={`/policies/${key}`}
                className="underline hover:text-foreground"
              >
                {val.title}
              </Link>
            ))}
        </div>
      </div>
    </StoreShell>
  );
}
