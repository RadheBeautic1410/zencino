import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { ContentManager } from "@/components/admin/content-manager";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_POLICIES,
  getPublishedContent,
  listAllContentPages,
} from "@/lib/commerce/content";

export const metadata = {
  title: "Content Administration - Zencino Admin",
};

const STANDARD_PAGES = [
  { slug: "home", title: "Homepage Hero & Highlights", type: "homepage" as const },
  { slug: "faq", title: "Frequently Asked Questions", type: "faq" as const },
  { slug: "about", title: "About Story & Philosophy", type: "about" as const },
  { slug: "policies-shipping", title: "Shipping Policy", type: "policy" as const },
  { slug: "policies-returns", title: "Returns & Cancellations", type: "policy" as const },
  { slug: "policies-privacy", title: "Privacy Policy", type: "policy" as const },
  { slug: "policies-terms", title: "Terms of Service", type: "policy" as const },
];

export default async function AdminContentPage() {
  const existingPages = await listAllContentPages();

  // Ensure all standard pages exist in the list
  const pages = STANDARD_PAGES.map((std) => {
    const found = existingPages.find((p) => p.slug === std.slug);
    return {
      id: found?.id || `virtual_${std.slug}`,
      slug: std.slug,
      title: std.title,
      type: std.type,
      currentVersionId: found?.currentVersionId || null,
      currentVersionNumber: found?.currentVersionNumber || null,
      publishedAt: found?.publishedAt || null,
    };
  });

  // Load current content data for each page
  const initialContents: Record<string, any> = {};

  const [home, faq, about, shipping, returns, privacy, terms] = await Promise.all([
    getPublishedContent("home", "homepage"),
    getPublishedContent("faq", "faq"),
    getPublishedContent("about", "about"),
    getPublishedContent("policies-shipping", "policy"),
    getPublishedContent("policies-returns", "policy"),
    getPublishedContent("policies-privacy", "policy"),
    getPublishedContent("policies-terms", "policy"),
  ]);

  initialContents["home"] = home.data;
  initialContents["faq"] = faq.data;
  initialContents["about"] = about.data;
  initialContents["policies-shipping"] = shipping.data;
  initialContents["policies-returns"] = returns.data;
  initialContents["policies-privacy"] = privacy.data;
  initialContents["policies-terms"] = terms.data;

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        eyebrow="Admin Operations"
        title="Content Administration"
        description="Versioned content management for homepage, FAQs, brand story, and statutory policy documents."
      />

      <ContentManager pages={pages} initialContents={initialContents} />
    </div>
  );
}
