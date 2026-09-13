"use client";

import { useState, useTransition } from "react";
import {
  ArrowSquareOut,
  Check,
  Copy,
  InstagramLogo,
  Megaphone,
  Plus,
  Receipt,
  ShoppingCart,
  WarningCircle,
} from "@phosphor-icons/react";
import { saveCampaignAction } from "@/app/actions/campaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildCampaignUtmUrl } from "@/lib/commerce/rules";
import type { CampaignPerformanceSummary } from "@/lib/commerce/campaigns";

interface Props {
  summaries: CampaignPerformanceSummary[];
}

export function CampaignManager({ summaries }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for live UTM URL preview
  const [formDataState, setFormDataState] = useState({
    code: "",
    name: "",
    source: "instagram",
    medium: "reel",
    campaign: "",
    content: "",
    landingPath: "/products",
    reelUrl: "",
  });

  const previewUtmUrl = buildCampaignUtmUrl({
    landingPath: formDataState.landingPath || "/products",
    source: formDataState.source || "instagram",
    medium: formDataState.medium || "reel",
    campaign: formDataState.campaign || formDataState.code || "campaign",
    content: formDataState.content || undefined,
  });

  const handleCopy = (url: string, code: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("active", "true");

    startTransition(async () => {
      const res = await saveCampaignAction(fd);
      if (res.success) {
        setShowCreateModal(false);
        window.location.reload();
      } else {
        setFormError(res.error || "Failed to save campaign");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Instagram & Marketing Campaigns</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track organic social attribution, Instagram reels deep links, and conversion funnels.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2 text-xs">
          <Plus size={14} /> New Campaign
        </Button>
      </div>

      {/* Campaigns Listing with Performance Funnel */}
      {summaries.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Megaphone size={40} className="mx-auto text-muted-foreground" />
          <h3 className="font-bold text-base">No Marketing Campaigns Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Create your first Instagram campaign to generate copyable deep links with UTM tracking parameters for your reels, bio, and stories.
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="mt-2">
            Create First Campaign
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {summaries.map((summary) => {
            const { campaign: c } = summary;
            const fullUtmUrl = buildCampaignUtmUrl({
              landingPath: c.landingPath,
              source: c.source,
              medium: c.medium,
              campaign: c.campaign,
              content: c.content,
            });

            return (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader className="border-b border-border bg-muted/10 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <InstagramLogo size={18} className="text-pink-600" />
                        <CardTitle className="text-base font-bold">{c.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-2xs uppercase">
                          {c.code}
                        </Badge>
                        <Badge variant="secondary" className="text-2xs capitalize">
                          {c.medium}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Target landing page: <span className="font-mono font-medium">{c.landingPath}</span>
                        {c.reelUrl && (
                          <>
                            {" "}·{" "}
                            <a
                              href={c.reelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              View Reel <ArrowSquareOut size={12} />
                            </a>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Copy Link Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(fullUtmUrl, c.code)}
                      className="gap-1.5 text-xs font-mono shrink-0"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check size={14} className="text-success" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy UTM Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Display UTM string */}
                  <div className="mt-3 bg-background border border-border p-2.5 rounded-lg flex items-center justify-between text-2xs font-mono text-muted-foreground overflow-x-auto">
                    <span className="truncate mr-2">{fullUtmUrl}</span>
                  </div>
                </CardHeader>

                {/* Conversion Funnel Grid */}
                <CardContent className="p-6">
                  <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground mb-4">
                    Attribution & Conversion Funnel
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1">
                      <span className="text-2xs font-semibold uppercase text-muted-foreground">Page Views</span>
                      <p className="font-black text-xl">{summary.pageViews}</p>
                    </div>

                    <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1">
                      <span className="text-2xs font-semibold uppercase text-muted-foreground">Product Views</span>
                      <p className="font-black text-xl">{summary.productViews}</p>
                    </div>

                    <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1">
                      <span className="text-2xs font-semibold uppercase text-muted-foreground">Added to Cart</span>
                      <p className="font-black text-xl">{summary.addToCarts}</p>
                    </div>

                    <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-1">
                      <span className="text-2xs font-semibold uppercase text-muted-foreground">Checkouts Started</span>
                      <p className="font-black text-xl">{summary.checkoutStarts}</p>
                    </div>

                    {/* Direct Paid Orders */}
                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase text-success">Direct Orders</span>
                        <Receipt size={14} className="text-success" />
                      </div>
                      <p className="font-black text-xl text-foreground">{summary.directOrdersCount}</p>
                      <p className="text-2xs text-muted-foreground font-semibold">
                        ₹{(summary.directRevenueMinor / 100).toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Amazon Outbound Clicks (Explicitly Referral Clicks) */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase text-amber-600">Amazon Clicks</span>
                        <ArrowSquareOut size={14} className="text-amber-500" />
                      </div>
                      <p className="font-black text-xl text-foreground">{summary.amazonOutboundClicks}</p>
                      <p className="text-2xs text-muted-foreground">Referral intent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold">Create Marketing Campaign</CardTitle>
              <CardDescription className="text-xs">
                Configure Instagram reel attribution and generate copyable UTM deep links.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <WarningCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Campaign Code * (Unique Slug)
                  </label>
                  <Input
                    name="code"
                    required
                    placeholder="e.g. acrylic_launch_01"
                    value={formDataState.code}
                    onChange={(e) =>
                      setFormDataState({ ...formDataState, code: e.target.value, campaign: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Campaign Title *
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Pen Holder Reel #1"
                    value={formDataState.name}
                    onChange={(e) => setFormDataState({ ...formDataState, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Source
                  </label>
                  <Input
                    name="source"
                    value={formDataState.source}
                    onChange={(e) => setFormDataState({ ...formDataState, source: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Medium
                  </label>
                  <select
                    name="medium"
                    value={formDataState.medium}
                    onChange={(e) => setFormDataState({ ...formDataState, medium: e.target.value })}
                    className="w-full border border-border bg-background px-3 py-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="reel">Reel</option>
                    <option value="story">Story</option>
                    <option value="bio">Instagram Bio</option>
                    <option value="influencer">Influencer Post</option>
                    <option value="post">Feed Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Content Tag (Optional)
                  </label>
                  <Input
                    name="content"
                    placeholder="e.g. clip_desk_01"
                    value={formDataState.content}
                    onChange={(e) => setFormDataState({ ...formDataState, content: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Destination Landing Path *
                </label>
                <Input
                  name="landingPath"
                  required
                  placeholder="/products/pencil-holder-2 or /collections/acrylic-essentials"
                  value={formDataState.landingPath}
                  onChange={(e) => setFormDataState({ ...formDataState, landingPath: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                  Instagram Reel / Post URL (Optional)
                </label>
                <Input
                  name="reelUrl"
                  placeholder="https://instagram.com/reel/..."
                  value={formDataState.reelUrl}
                  onChange={(e) => setFormDataState({ ...formDataState, reelUrl: e.target.value })}
                />
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground mb-1">
                  Generated Attribution URL Preview
                </p>
                <div className="bg-muted/40 p-3 rounded-lg border border-border font-mono text-xs text-foreground break-all">
                  {previewUtmUrl}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Saving..." : "Create Campaign"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
