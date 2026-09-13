"use client";

import { useState, useTransition } from "react";
import {
  Article,
  CheckCircle,
  Clock,
  FloppyDisk,
  Plus,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { publishContentAction, saveContentDraftAction } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Props {
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    type: string;
    currentVersionId: string | null;
    currentVersionNumber: number | null;
    publishedAt: Date | null;
  }>;
  initialContents: Record<string, any>;
}

export function ContentManager({ pages, initialContents }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string>(pages[0]?.slug || "home");
  const [contents, setContents] = useState<Record<string, any>>(initialContents);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentPage = pages.find((p) => p.slug === selectedSlug) || pages[0];
  const currentData = contents[selectedSlug] || {};

  const handleUpdateField = (field: string, value: any) => {
    setContents((prev) => ({
      ...prev,
      [selectedSlug]: {
        ...prev[selectedSlug],
        [field]: value,
      },
    }));
  };

  const handleSaveAndPublish = (publish: boolean) => {
    setStatusMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("slug", selectedSlug);
      formData.set("title", currentPage.title);
      formData.set("type", currentPage.type);
      formData.set("summary", publish ? "Published via admin editor" : "Draft saved via admin editor");
      formData.set("data", JSON.stringify(currentData));

      const draftRes = await saveContentDraftAction(formData);
      if (!draftRes.success || !draftRes.versionId) {
        setStatusMessage({ type: "error", text: draftRes.error || "Failed to save draft" });
        return;
      }

      if (publish) {
        const pubData = new FormData();
        pubData.set("versionId", draftRes.versionId);
        const pubRes = await publishContentAction(pubData);
        if (pubRes.success) {
          setStatusMessage({
            type: "success",
            text: `Successfully published version ${pubRes.version} of '${currentPage.title}'! Changes are live on the storefront.`,
          });
        } else {
          setStatusMessage({ type: "error", text: pubRes.error || "Failed to publish" });
        }
      } else {
        setStatusMessage({
          type: "success",
          text: `Saved draft version ${draftRes.version}. Click 'Publish Version' when ready to make it live.`,
        });
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Navigation list of manageable pages (4 cols) */}
      <div className="lg:col-span-4 space-y-2">
        <p className="text-2xs font-bold uppercase tracking-ui text-muted-foreground px-1 mb-2">
          Manageable Pages & Sections
        </p>
        <div className="space-y-1">
          {pages.map((p) => {
            const isSelected = p.slug === selectedSlug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  setSelectedSlug(p.slug);
                  setStatusMessage(null);
                }}
                className={`w-full text-left p-3.5 border rounded-xl transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{p.title}</span>
                  <Badge variant={p.currentVersionNumber ? "default" : "secondary"} className="text-2xs">
                    {p.currentVersionNumber ? `v${p.currentVersionNumber}` : "Default"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-2xs text-muted-foreground">
                  <span className="font-mono">/{p.slug === "home" ? "" : p.slug.replace("policies-", "policies/")}</span>
                  {p.publishedAt && (
                    <>
                      <span>·</span>
                      <span>{new Date(p.publishedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Form Editor (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">{currentPage.title}</CardTitle>
                <Badge variant="outline" className="text-2xs font-mono">
                  {currentPage.type}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Edit and publish copy with automatic version tracking and zero-downtime fallback.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => handleSaveAndPublish(false)}
                className="gap-1 text-xs"
              >
                <FloppyDisk size={14} />
                Save Draft
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleSaveAndPublish(true)}
                className="gap-1 text-xs"
              >
                <UploadSimple size={14} />
                Publish Live
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {statusMessage && (
              <div
                className={`p-3.5 rounded-lg flex items-center gap-2 text-xs ${
                  statusMessage.type === "success"
                    ? "bg-success/15 border border-success/30 text-success"
                    : "bg-destructive/15 border border-destructive/30 text-destructive"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle size={16} weight="fill" />
                ) : (
                  <WarningCircle size={16} weight="fill" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Render fields based on page type */}
            {currentPage.type === "homepage" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Eyebrow Pill Badge
                  </label>
                  <Input
                    value={currentData.eyebrowBadge || ""}
                    onChange={(e) => handleUpdateField("eyebrowBadge", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Headline (Line 1)
                    </label>
                    <Input
                      value={currentData.headline || ""}
                      onChange={(e) => handleUpdateField("headline", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Headline (Line 2 Accent)
                    </label>
                    <Input
                      value={currentData.headlineSub || ""}
                      onChange={(e) => handleUpdateField("headlineSub", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Hero Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    value={currentData.description || ""}
                    onChange={(e) => handleUpdateField("description", e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Primary CTA Button Text
                    </label>
                    <Input
                      value={currentData.ctaPrimaryText || ""}
                      onChange={(e) => handleUpdateField("ctaPrimaryText", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Primary CTA Destination Link
                    </label>
                    <Input
                      value={currentData.ctaPrimaryLink || ""}
                      onChange={(e) => handleUpdateField("ctaPrimaryLink", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentPage.type === "faq" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                    FAQ Question & Answer Pairs
                  </p>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      const items = [...(currentData.items || [])];
                      items.push({ q: "New Question?", a: "Answer here." });
                      handleUpdateField("items", items);
                    }}
                    className="gap-1"
                  >
                    <Plus size={12} /> Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {(currentData.items || []).map((faq: any, idx: number) => (
                    <div key={idx} className="border border-border p-4 rounded-lg bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const items = [...currentData.items];
                            items.splice(idx, 1);
                            handleUpdateField("items", items);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <Input
                        placeholder="Question"
                        value={faq.q || ""}
                        onChange={(e) => {
                          const items = [...currentData.items];
                          items[idx] = { ...items[idx], q: e.target.value };
                          handleUpdateField("items", items);
                        }}
                      />
                      <textarea
                        rows={2}
                        placeholder="Answer"
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        value={faq.a || ""}
                        onChange={(e) => {
                          const items = [...currentData.items];
                          items[idx] = { ...items[idx], a: e.target.value };
                          handleUpdateField("items", items);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentPage.type === "about" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Philosophy Eyebrow
                  </label>
                  <Input
                    value={currentData.eyebrow || ""}
                    onChange={(e) => handleUpdateField("eyebrow", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Page Headline
                  </label>
                  <Input
                    value={currentData.headline || ""}
                    onChange={(e) => handleUpdateField("headline", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Introductory Lead Paragraph
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    value={currentData.lead || ""}
                    onChange={(e) => handleUpdateField("lead", e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                    Story Sections
                  </p>
                  {(currentData.sections || []).map((sec: any, idx: number) => (
                    <div key={idx} className="border border-border p-4 rounded-lg bg-muted/20 space-y-2">
                      <Input
                        placeholder="Section Heading"
                        value={sec.heading || ""}
                        onChange={(e) => {
                          const sections = [...currentData.sections];
                          sections[idx] = { ...sections[idx], heading: e.target.value };
                          handleUpdateField("sections", sections);
                        }}
                      />
                      <textarea
                        rows={3}
                        placeholder="Section Body"
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        value={sec.body || ""}
                        onChange={(e) => {
                          const sections = [...currentData.sections];
                          sections[idx] = { ...sections[idx], body: e.target.value };
                          handleUpdateField("sections", sections);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentPage.type === "policy" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Policy Title
                  </label>
                  <Input
                    value={currentData.title || ""}
                    onChange={(e) => handleUpdateField("title", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Policy Subtitle / Summary
                  </label>
                  <Input
                    value={currentData.subtitle || ""}
                    onChange={(e) => handleUpdateField("subtitle", e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Policy Sections
                    </p>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        const content = [...(currentData.content || [])];
                        content.push({ heading: "New Clause", body: "Clause terms..." });
                        handleUpdateField("content", content);
                      }}
                      className="gap-1"
                    >
                      <Plus size={12} /> Add Clause
                    </Button>
                  </div>

                  {(currentData.content || []).map((clause: any, idx: number) => (
                    <div key={idx} className="border border-border p-4 rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                          Clause #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const content = [...currentData.content];
                            content.splice(idx, 1);
                            handleUpdateField("content", content);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <Input
                        placeholder="Clause Heading"
                        value={clause.heading || ""}
                        onChange={(e) => {
                          const content = [...currentData.content];
                          content[idx] = { ...content[idx], heading: e.target.value };
                          handleUpdateField("content", content);
                        }}
                      />
                      <textarea
                        rows={3}
                        placeholder="Clause Body"
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        value={clause.body || ""}
                        onChange={(e) => {
                          const content = [...currentData.content];
                          content[idx] = { ...content[idx], body: e.target.value };
                          handleUpdateField("content", content);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
