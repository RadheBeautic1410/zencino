import { CampaignManager } from "@/components/admin/campaign-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { StoreFunnel } from "@/components/admin/store-funnel";
import {
  getCampaignPerformanceReport,
  getStoreFunnel,
} from "@/lib/commerce/campaigns";

export const metadata = {
  title: "Marketing Campaigns - Zencino Admin",
};

export default async function AdminCampaignsPage() {
  const [summaries, funnel] = await Promise.all([
    getCampaignPerformanceReport(),
    getStoreFunnel(),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Manage campaign attribution links, measure funnel conversion, and analyze Amazon outbound interest."
        eyebrow="Marketing Operations"
        title="Instagram & Social Campaigns"
      />

      <StoreFunnel funnel={funnel} />

      <CampaignManager summaries={summaries} />
    </div>
  );
}
