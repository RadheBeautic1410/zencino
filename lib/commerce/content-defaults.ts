export interface HomepageContentData {
  announcementBanner?: string;
  ctaPrimaryLink: string;
  ctaPrimaryText: string;
  ctaSecondaryLink: string;
  ctaSecondaryText: string;
  description: string;
  eyebrowBadge: string;
  headline: string;
  headlineSub: string;
  highlights: Array<{ title: string; subtitle: string; icon: string }>;
}

export interface FaqContentData {
  eyebrow?: string;
  items: Array<{ q: string; a: string }>;
  subtitle?: string;
  title?: string;
}

export interface AboutContentData {
  eyebrow: string;
  headline: string;
  lead: string;
  sections: Array<{ heading: string; body: string }>;
}

export interface PolicyContentData {
  content: Array<{ heading: string; body: string }>;
  subtitle: string;
  title: string;
}

/**
 * Loose union of every editable content shape, used by the admin editor where a
 * single form state holds whichever page type is selected.
 */
export type EditableContentData = Partial<HomepageContentData> &
  Partial<FaqContentData> &
  Partial<AboutContentData> &
  Partial<PolicyContentData>;

export type EditableContentValue =
  EditableContentData[keyof EditableContentData];

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContentData = {
  eyebrowBadge: "Modern Everyday Organization",
  headline: "A little order.",
  headlineSub: "A lot of possibility.",
  description:
    "Discover Zencino for your home, kitchen, and workspace. From crystal-clear acrylic organizers to functional daily essentials.",
  ctaPrimaryText: "Shop All Products",
  ctaPrimaryLink: "/products",
  ctaSecondaryText: "Explore Acrylic Essentials",
  ctaSecondaryLink: "/collections/acrylic-essentials",
  announcementBanner: "Complimentary pan-India delivery on orders above ₹999",
  highlights: [
    {
      title: "Diamond Polished",
      subtitle: "Edge-buffed optical clarity",
      icon: "ShieldCheck",
    },
    {
      title: "Amazon Available",
      subtitle: "Prime-eligible fast checkout",
      icon: "ArrowSquareOut",
    },
    {
      title: "Pan-India Delivery",
      subtitle: "Standard 3-5 day transit",
      icon: "Truck",
    },
  ],
};

export const DEFAULT_FAQ_CONTENT: FaqContentData = {
  eyebrow: "Help & Information",
  title: "Frequently Asked Questions",
  subtitle:
    "Everything you need to know about shopping with Zencino, product care, and shipping.",
  items: [
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
  ],
};

export const DEFAULT_ABOUT_CONTENT: AboutContentData = {
  eyebrow: "Our Philosophy",
  headline: "A little order. A lot of possibility.",
  lead: "At Zencino, we believe that an uncluttered environment creates space for clarity, creativity, and calm.",
  sections: [
    {
      heading: "Why We Started",
      body: "Modern living can often feel overwhelmed by small daily clutter — loose pens on a work desk, makeup brushes on a vanity, or kitchen accessories misplaced in drawers. We founded Zencino with a simple goal: craft durable, minimalist, and crystal-clear organizers that blend seamlessly into any room while making what you need easy to find at a glance.",
    },
    {
      heading: "Material & Precision",
      body: "We focus on premium, optical-grade acrylic that offers up to 99% light transmission. Unlike brittle, yellowing plastics, our acrylic organizers feature diamond-buffed edges for a smooth, glass-like finish that is safe to handle and built to last.",
    },
    {
      heading: "Dual-Channel Flexibility",
      body: "We believe in meeting customers where they prefer to shop. Whether you order directly through our store or use your existing Amazon Prime account for fast, trusted fulfillment, you get authentic Zencino quality backed by transparent specifications.",
    },
  ],
};

export const DEFAULT_POLICIES: Record<string, PolicyContentData> = {
  shipping: {
    title: "Shipping Policy",
    subtitle:
      "Transparent delivery times, dispatch promises, and coverage across India.",
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
    subtitle:
      "Operating terms governing the use of Zencino's website and services.",
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
