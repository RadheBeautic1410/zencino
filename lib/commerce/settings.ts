import { eq } from "drizzle-orm";
import { type StoreSetting, storeSettings } from "@/db/schema/settings";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export interface StoreProfileConfig {
  storeName: string;
  legalEntityName: string;
  gstin: string;
  pan: string;
  cin: string;
  registeredAddress: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  dispatchPromise: string;
  checkoutEnabled: boolean;
}

export const DEFAULT_STORE_CONFIG: StoreProfileConfig = {
  storeName: "Zencino",
  legalEntityName: "Zencino Retail Solutions Pvt. Ltd.",
  gstin: "27AAACZ1234A1Z5",
  pan: "AAACZ1234A",
  cin: "U52100MH2026PTC123456",
  registeredAddress: "Unit 402, Trade Link Hub, Lower Parel, Mumbai, Maharashtra 400013, India",
  supportEmail: "support@zencino.com",
  supportPhone: "+91 98765 43210",
  supportHours: "Mon–Fri, 10:00 AM – 6:00 PM IST",
  dispatchPromise: "Orders dispatched within 24-48 business hours via insured express courier networks.",
  checkoutEnabled: true,
};

export async function getStoreProfileConfig(): Promise<StoreProfileConfig> {
  try {
    const [row] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, "store_profile"))
      .limit(1);

    if (row?.value) {
      return {
        ...DEFAULT_STORE_CONFIG,
        ...(row.value as unknown as Partial<StoreProfileConfig>),
      };
    }
  } catch (error) {
    console.error("[settings] error loading store profile config:", error);
  }

  return DEFAULT_STORE_CONFIG;
}

export async function updateStoreProfileConfig(input: {
  config: Partial<StoreProfileConfig>;
  actorId?: string;
  actorEmail?: string;
}): Promise<StoreProfileConfig> {
  const current = await getStoreProfileConfig();
  const updatedConfig: StoreProfileConfig = {
    ...current,
    ...input.config,
  };

  const now = new Date();
  await db
    .insert(storeSettings)
    .values({
      key: "store_profile",
      value: updatedConfig as unknown as Record<string, unknown>,
      updatedBy: input.actorId ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: storeSettings.key,
      set: {
        value: updatedConfig as unknown as Record<string, unknown>,
        updatedBy: input.actorId ?? null,
        updatedAt: now,
      },
    });

  await audit({
    action: "settings.store_profile_updated",
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    entityType: "store_settings",
    entityId: "store_profile",
    description: "Updated store profile and business information",
    metadata: {
      checkoutEnabled: updatedConfig.checkoutEnabled,
      legalEntityName: updatedConfig.legalEntityName,
    },
  });

  return updatedConfig;
}
