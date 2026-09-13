"use client";

import { useState, useTransition } from "react";
import {
  Building,
  CheckCircle,
  Clock,
  FloppyDisk,
  Gear,
  ListBullets,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { updateSettingsAction } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StoreProfileConfig } from "@/lib/commerce/settings";

interface AuditLogRow {
  id: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: Date;
}

interface Props {
  initialConfig: StoreProfileConfig;
  auditLogs: AuditLogRow[];
}

export function SettingsManager({ initialConfig, auditLogs }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "audit">("profile");
  const [config, setConfig] = useState(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-ui transition-colors ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building size={16} />
          Store Profile & Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-ui transition-colors ${
            activeTab === "audit"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
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
            <CardTitle className="text-base font-bold">Business & Legal Information</CardTitle>
            <CardDescription className="text-xs">
              Configured entity details appear on statutory GST Tax Invoices and Credit Notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Store Brand Name *
                  </label>
                  <Input
                    name="storeName"
                    required
                    value={config.storeName}
                    onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Legal Registered Entity Name *
                  </label>
                  <Input
                    name="legalEntityName"
                    required
                    value={config.legalEntityName}
                    onChange={(e) => setConfig({ ...config, legalEntityName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    GSTIN *
                  </label>
                  <Input
                    name="gstin"
                    required
                    value={config.gstin}
                    onChange={(e) => setConfig({ ...config, gstin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    PAN
                  </label>
                  <Input
                    name="pan"
                    value={config.pan}
                    onChange={(e) => setConfig({ ...config, pan: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    CIN
                  </label>
                  <Input
                    name="cin"
                    value={config.cin}
                    onChange={(e) => setConfig({ ...config, cin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Registered Office Address *
                </label>
                <textarea
                  name="registeredAddress"
                  required
                  rows={2}
                  className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                  value={config.registeredAddress}
                  onChange={(e) => setConfig({ ...config, registeredAddress: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Customer Support Email *
                  </label>
                  <Input
                    name="supportEmail"
                    required
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Customer Support Phone
                  </label>
                  <Input
                    name="supportPhone"
                    value={config.supportPhone}
                    onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Support Working Hours
                  </label>
                  <Input
                    name="supportHours"
                    value={config.supportHours}
                    onChange={(e) => setConfig({ ...config, supportHours: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Dispatch SLA Promise Statement
                </label>
                <Input
                  name="dispatchPromise"
                  value={config.dispatchPromise}
                  onChange={(e) => setConfig({ ...config, dispatchPromise: e.target.value })}
                />
              </div>

              {/* Direct Checkout Switch */}
              <div className="p-4 border border-border rounded-xl bg-muted/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-ui">Direct Website Checkout</h4>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    Controls whether customers can place prepaid direct website orders via UPI QR / gateway.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.checkoutEnabled}
                    onChange={(e) => setConfig({ ...config, checkoutEnabled: e.target.checked })}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold">{config.checkoutEnabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" disabled={isPending} className="gap-2 text-xs">
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
            <CardTitle className="text-base font-bold">System Audit Log Trail</CardTitle>
            <CardDescription className="text-xs">
              Chronological, tamper-evident log of administrative events and operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No audit log entries recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-2xs">
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
