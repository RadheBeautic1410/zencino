import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { SettingsManager } from "@/components/admin/settings-manager";
import { auditLogs } from "@/db/schema";
import { getStoreProfileConfig } from "@/lib/commerce/settings";
import { db } from "@/lib/db";

export const metadata = {
  title: "Settings & Audit - Zencino Admin",
};

interface SearchParams {
  entity?: string;
  q?: string;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { entity, q } = await searchParams;

  const conditions: SQL[] = [];
  if (entity) {
    conditions.push(eq(auditLogs.entityType, entity));
  }
  const term = q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    const match = or(
      ilike(auditLogs.action, pattern),
      ilike(auditLogs.actorEmail, pattern),
      ilike(auditLogs.description, pattern),
      ilike(auditLogs.entityId, pattern)
    );
    if (match) {
      conditions.push(match);
    }
  }

  const [config, recentLogs, entityTypes] = await Promise.all([
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(conditions.length > 0 ? 100 : 30),
    db
      .selectDistinct({ entityType: auditLogs.entityType })
      .from(auditLogs)
      .orderBy(auditLogs.entityType),
  ]);

  return (
    <div className="space-y-8">
      <OrbitPageHeader
        description="Configure legal business disclosures, support channels, checkout switches, and inspect system audit trail."
        eyebrow="Admin Operations"
        title="Store Settings & Audit"
      />

      <SettingsManager
        auditEntityTypes={entityTypes.map((row) => row.entityType)}
        auditLogs={recentLogs}
        initialConfig={config}
        initialTab={conditions.length > 0 ? "audit" : "profile"}
      />
    </div>
  );
}
