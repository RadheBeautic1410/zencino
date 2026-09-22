import { CampaignManager } from "@/components/admin/campaign-manager";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { getCampaignPerformanceReport } from "@/lib/commerce/campaigns";

export const metadata = {
  title: "Marketing Campaigns - Zencino Admin",
};

export default async function AdminCampaignsPage() {
  const summaries = await getCampaignPerformanceReport();

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Manage campaign attribution links, measure funnel conversion, and analyze Amazon outbound interest."
        eyebrow="Marketing Operations"
        title="Instagram & Social Campaigns"
      />

      <CampaignManager summaries={summaries} />
    </div>
  );
}
