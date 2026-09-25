"use client";

import {
  Building,
  CheckCircle,
  Clock,
  FloppyDisk,
  ListBullets,
  WarningCircle,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StoreProfileConfig } from "@/lib/commerce/settings";

interface AuditLogRow {
  action: string;
  actorEmail: string | null;
  createdAt: Date;
  description: string;
  entityId: string | null;
  entityType: string;
  id: string;
}

interface Props {
  auditEntityTypes: string[];
  auditLogs: AuditLogRow[];
  initialConfig: StoreProfileConfig;
  initialTab?: "profile" | "audit";
}

export function SettingsManager({
  initialConfig,
  auditEntityTypes,
  auditLogs,
  initialTab = "profile",
}: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "audit">(initialTab);
  const [config, setConfig] = useState(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    fd.set("checkoutEnabled", config.checkoutEnabled ? "true" : "false");

    startTransition(async () => {
      const res = await updateSettingsAction(fd);
      if (res.success) {
        setFeedback({
          type: "success",
          text: "Store profile settings updated successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Failed to update settings",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-ui transition-colors ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("profile")}
          type="button"
        >
          <Building size={16} />
          Store Profile & Details
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-ui transition-colors ${
            activeTab === "audit"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("audit")}
          type="button"
        >
          <ListBullets size={16} />
          Audit Trail Log
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 text-xs ${
            feedback.type === "success"
              ? "bg-success/15 border border-success/30 text-success"
              : "bg-destructive/15 border border-destructive/30 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={16} weight="fill" />
          ) : (
            <WarningCircle size={16} weight="fill" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {activeTab === "profile" ? (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-bold">
              Business & Legal Information
            </CardTitle>
            <CardDescription className="text-xs">
              Configured entity details appear on statutory GST Tax Invoices and
              Credit Notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-store-brand-name"
                  >
                    Store Brand Name *
                  </label>
                  <Input
                    id="settings-manager-store-brand-name"
                    name="storeName"
                    onChange={(e) =>
                      setConfig({ ...config, storeName: e.target.value })
                    }
                    required
                    value={config.storeName}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-legal-registered-entity-name"
                  >
                    Legal Registered Entity Name *
                  </label>
                  <Input
                    id="settings-manager-legal-registered-entity-name"
                    name="legalEntityName"
                    onChange={(e) =>
                      setConfig({ ...config, legalEntityName: e.target.value })
                    }
                    required
                    value={config.legalEntityName}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-gstin"
                  >
                    GSTIN *
                  </label>
                  <Input
                    id="settings-manager-gstin"
                    name="gstin"
                    onChange={(e) =>
                      setConfig({ ...config, gstin: e.target.value })
                    }
                    required
                    value={config.gstin}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-pan"
                  >
                    PAN
                  </label>
                  <Input
                    id="settings-manager-pan"
                    name="pan"
                    onChange={(e) =>
                      setConfig({ ...config, pan: e.target.value })
                    }
                    value={config.pan}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-cin"
                  >
                    CIN
                  </label>
                  <Input
                    id="settings-manager-cin"
                    name="cin"
                    onChange={(e) =>
                      setConfig({ ...config, cin: e.target.value })
                    }
                    value={config.cin}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="settings-manager-registered-office-address"
                >
                  Registered Office Address *
                </label>
                <textarea
                  className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                  id="settings-manager-registered-office-address"
                  name="registeredAddress"
                  onChange={(e) =>
                    setConfig({ ...config, registeredAddress: e.target.value })
                  }
                  required
                  rows={2}
                  value={config.registeredAddress}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-customer-support-email"
                  >
                    Customer Support Email *
                  </label>
                  <Input
                    id="settings-manager-customer-support-email"
                    name="supportEmail"
                    onChange={(e) =>
                      setConfig({ ...config, supportEmail: e.target.value })
                    }
                    required
                    type="email"
                    value={config.supportEmail}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-customer-support-phone"
                  >
                    Customer Support Phone
                  </label>
                  <Input
                    id="settings-manager-customer-support-phone"
                    name="supportPhone"
                    onChange={(e) =>
                      setConfig({ ...config, supportPhone: e.target.value })
                    }
                    value={config.supportPhone}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="settings-manager-support-working-hours"
                  >
                    Support Working Hours
                  </label>
                  <Input
                    id="settings-manager-support-working-hours"
                    name="supportHours"
                    onChange={(e) =>
                      setConfig({ ...config, supportHours: e.target.value })
                    }
                    value={config.supportHours}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                  htmlFor="settings-manager-dispatch-sla-promise-statement"
                >
                  Dispatch SLA Promise Statement
                </label>
                <Input
                  id="settings-manager-dispatch-sla-promise-statement"
                  name="dispatchPromise"
                  onChange={(e) =>
                    setConfig({ ...config, dispatchPromise: e.target.value })
                  }
                  value={config.dispatchPromise}
                />
              </div>

              {/* Direct Checkout Switch */}
              <div className="p-4 border border-border rounded-xl bg-muted/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-ui">
                    Direct Website Checkout
                  </h4>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    Controls whether customers can place prepaid direct website
                    orders via UPI QR / gateway.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    checked={config.checkoutEnabled}
                    className="size-4 rounded text-primary focus:ring-primary"
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        checkoutEnabled: e.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span className="text-xs font-semibold">
                    {config.checkoutEnabled ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  className="gap-2 text-xs"
                  disabled={isPending}
                  type="submit"
                >
                  <FloppyDisk size={14} />
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Audit Trail Tab */
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-bold">
              System Audit Log Trail
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological, tamper-evident log of administrative events and
              operations.
            </CardDescription>
          </CardHeader>
          <div className="px-4 pt-4">
            <AdminFilterBar
              searchPlaceholder="Search action, actor email or description..."
              selects={[
                {
                  label: "Entity",
                  param: "entity",
                  options: auditEntityTypes.map((value) => ({
                    label: value,
                    value,
                  })),
                },
              ]}
            />
          </div>
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No audit log entries match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <div
                    className="p-4 hover:bg-muted/20 transition-colors text-xs space-y-1"
                    key={log.id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="font-mono text-2xs" variant="outline">
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          {log.actorEmail || "System"}
                        </span>
                      </div>
                      <span className="text-2xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
