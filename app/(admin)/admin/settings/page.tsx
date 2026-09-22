import { desc } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { SettingsManager } from "@/components/admin/settings-manager";
import { auditLogs } from "@/db/schema";
import { getStoreProfileConfig } from "@/lib/commerce/settings";
import { db } from "@/lib/db";

export const metadata = {
  title: "Settings & Audit - Zencino Admin",
};

export default async function AdminSettingsPage() {
  const [config, recentLogs] = await Promise.all([
    getStoreProfileConfig(),
    db
      .select({
        id: auditLogs.id,
        actorEmail: auditLogs.actorEmail,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(30),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Configure legal business disclosures, support channels, checkout switches, and inspect system audit trail."
        eyebrow="Admin Operations"
        title="Store Settings & Audit"
      />

      <SettingsManager auditLogs={recentLogs} initialConfig={config} />
    </div>
  );
}
