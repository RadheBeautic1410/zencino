import { ContentManager } from "@/components/admin/content-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import {
  getPublishedContent,
  listAllContentPages,
} from "@/lib/commerce/content";
import type { EditableContentData } from "@/lib/commerce/content-defaults";

export const metadata = {
  title: "Content Administration - Zencino Admin",
};

const STANDARD_PAGES = [
  {
    slug: "home",
    title: "Homepage Hero & Highlights",
    type: "homepage" as const,
  },
  { slug: "faq", title: "Frequently Asked Questions", type: "faq" as const },
  { slug: "about", title: "About Story & Philosophy", type: "about" as const },
  {
    slug: "policies-shipping",
    title: "Shipping Policy",
    type: "policy" as const,
  },
  {
    slug: "policies-returns",
    title: "Returns & Cancellations",
    type: "policy" as const,
  },
  {
    slug: "policies-privacy",
    title: "Privacy Policy",
    type: "policy" as const,
  },
  {
    slug: "policies-terms",
    title: "Terms of Service",
    type: "policy" as const,
  },
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
  const initialContents: Record<string, EditableContentData> = {};

  const [home, faq, about, shipping, returns, privacy, terms] =
    await Promise.all([
      getPublishedContent<EditableContentData>("home", "homepage"),
      getPublishedContent<EditableContentData>("faq", "faq"),
      getPublishedContent<EditableContentData>("about", "about"),
      getPublishedContent<EditableContentData>("policies-shipping", "policy"),
      getPublishedContent<EditableContentData>("policies-returns", "policy"),
      getPublishedContent<EditableContentData>("policies-privacy", "policy"),
      getPublishedContent<EditableContentData>("policies-terms", "policy"),
    ]);

  initialContents.home = home.data;
  initialContents.faq = faq.data;
  initialContents.about = about.data;
  initialContents["policies-shipping"] = shipping.data;
  initialContents["policies-returns"] = returns.data;
  initialContents["policies-privacy"] = privacy.data;
  initialContents["policies-terms"] = terms.data;

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Versioned content management for homepage, FAQs, brand story, and statutory policy documents."
        eyebrow="Admin Operations"
        title="Content Administration"
      />

      <ContentManager initialContents={initialContents} pages={pages} />
    </div>
  );
}
