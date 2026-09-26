"use client";

import {
  CheckCircle,
  FloppyDisk,
  Plus,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import {
  publishContentAction,
  saveContentDraftAction,
} from "@/app/actions/content";
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
import type {
  EditableContentData,
  EditableContentValue,
} from "@/lib/commerce/content-defaults";

interface Props {
  initialContents: Record<string, EditableContentData>;
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    type: string;
    currentVersionId: string | null;
    currentVersionNumber: number | null;
    publishedAt: Date | null;
  }>;
}

export function ContentManager({ pages, initialContents }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    pages[0]?.slug || "home"
  );
  const [contents, setContents] =
    useState<Record<string, EditableContentData>>(initialContents);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const currentPage = pages.find((p) => p.slug === selectedSlug) || pages[0];
  const currentData = contents[selectedSlug] || {};

  const handleUpdateField = (
    field: keyof EditableContentData,
    value: EditableContentValue
  ) => {
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
      formData.set(
        "summary",
        publish ? "Published via admin editor" : "Draft saved via admin editor"
      );
      formData.set("data", JSON.stringify(currentData));

      const draftRes = await saveContentDraftAction(formData);
      if (!draftRes.success || !draftRes.versionId) {
        setStatusMessage({
          type: "error",
          text: draftRes.error || "Failed to save draft",
        });
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
          setStatusMessage({
            type: "error",
            text: pubRes.error || "Failed to publish",
          });
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
                className={`w-full text-left p-3.5 border rounded-xl transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
                key={p.slug}
                onClick={() => {
                  setSelectedSlug(p.slug);
                  setStatusMessage(null);
                }}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{p.title}</span>
                  <Badge
                    className="text-2xs"
                    variant={p.currentVersionNumber ? "default" : "secondary"}
                  >
                    {p.currentVersionNumber
                      ? `v${p.currentVersionNumber}`
                      : "Default"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-2xs text-muted-foreground">
                  <span className="font-mono">
                    /
                    {p.slug === "home"
                      ? ""
                      : p.slug.replace("policies-", "policies/")}
                  </span>
                  {p.publishedAt && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(p.publishedAt).toLocaleDateString()}
                      </span>
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
                <CardTitle className="text-base font-bold">
                  {currentPage.title}
                </CardTitle>
                <Badge className="text-2xs font-mono" variant="outline">
                  {currentPage.type}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Edit and publish copy with automatic version tracking and
                zero-downtime fallback.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gap-1 text-xs"
                disabled={isPending}
                onClick={() => handleSaveAndPublish(false)}
                size="sm"
                variant="secondary"
              >
                <FloppyDisk size={14} />
                Save Draft
              </Button>
              <Button
                className="gap-1 text-xs"
                disabled={isPending}
                onClick={() => handleSaveAndPublish(true)}
                size="sm"
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
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-eyebrow-pill-badge"
                  >
                    Eyebrow Pill Badge
                  </label>
                  <Input
                    id="content-manager-eyebrow-pill-badge"
                    onChange={(e) =>
                      handleUpdateField("eyebrowBadge", e.target.value)
                    }
                    value={currentData.eyebrowBadge || ""}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-headline-line-1"
                    >
                      Headline (Line 1)
                    </label>
                    <Input
                      id="content-manager-headline-line-1"
                      onChange={(e) =>
                        handleUpdateField("headline", e.target.value)
                      }
                      value={currentData.headline || ""}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-headline-line-2-accent"
                    >
                      Headline (Line 2 Accent)
                    </label>
                    <Input
                      id="content-manager-headline-line-2-accent"
                      onChange={(e) =>
                        handleUpdateField("headlineSub", e.target.value)
                      }
                      value={currentData.headlineSub || ""}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-hero-description"
                  >
                    Hero Description
                  </label>
                  <textarea
                    className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    id="content-manager-hero-description"
                    onChange={(e) =>
                      handleUpdateField("description", e.target.value)
                    }
                    rows={3}
                    value={currentData.description || ""}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-primary-cta-button-text"
                    >
                      Primary CTA Button Text
                    </label>
                    <Input
                      id="content-manager-primary-cta-button-text"
                      onChange={(e) =>
                        handleUpdateField("ctaPrimaryText", e.target.value)
                      }
                      value={currentData.ctaPrimaryText || ""}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-primary-cta-destination-link"
                    >
                      Primary CTA Destination Link
                    </label>
                    <Input
                      id="content-manager-primary-cta-destination-link"
                      onChange={(e) =>
                        handleUpdateField("ctaPrimaryLink", e.target.value)
                      }
                      value={currentData.ctaPrimaryLink || ""}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-hero-video-url"
                    >
                      Hero Video URL
                    </label>
                    <Input
                      id="content-manager-hero-video-url"
                      onChange={(e) =>
                        handleUpdateField("heroVideoUrl", e.target.value)
                      }
                      placeholder="/video/hero-1.mp4"
                      value={currentData.heroVideoUrl || ""}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="content-manager-hero-video-poster"
                    >
                      Hero Video Poster
                    </label>
                    <Input
                      id="content-manager-hero-video-poster"
                      onChange={(e) =>
                        handleUpdateField("heroVideoPoster", e.target.value)
                      }
                      placeholder="/video/hero-1-poster.jpg"
                      value={currentData.heroVideoPoster || ""}
                    />
                  </div>
                </div>
                <p className="-mt-2 text-2xs text-muted-foreground">
                  The clip plays muted and looped behind the headline. The
                  poster shows while it loads, and replaces it entirely for
                  visitors who ask for reduced motion. Clear the video field to
                  fall back to the acrylic organizer rendered in 3D.
                </p>
              </div>
            )}

            {currentPage.type === "faq" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                    FAQ Question & Answer Pairs
                  </p>
                  <Button
                    className="gap-1"
                    onClick={() => {
                      const items = [...(currentData.items || [])];
                      items.push({ q: "New Question?", a: "Answer here." });
                      handleUpdateField("items", items);
                    }}
                    size="xs"
                    variant="secondary"
                  >
                    <Plus size={12} /> Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {(currentData.items || []).map((faq, idx) => (
                    <div
                      className="border border-border p-4 rounded-lg bg-muted/20 space-y-3"
                      // biome-ignore lint/suspicious/noArrayIndexKey: editor rows are positional; their text changes on every keystroke so it cannot be a stable key.
                      key={idx}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                          Item #{idx + 1}
                        </span>
                        <button
                          className="text-muted-foreground hover:text-destructive p-1"
                          onClick={() => {
                            const items = [...(currentData.items ?? [])];
                            items.splice(idx, 1);
                            handleUpdateField("items", items);
                          }}
                          type="button"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <Input
                        onChange={(e) => {
                          const items = [...(currentData.items ?? [])];
                          items[idx] = { ...items[idx], q: e.target.value };
                          handleUpdateField("items", items);
                        }}
                        placeholder="Question"
                        value={faq.q || ""}
                      />
                      <textarea
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        onChange={(e) => {
                          const items = [...(currentData.items ?? [])];
                          items[idx] = { ...items[idx], a: e.target.value };
                          handleUpdateField("items", items);
                        }}
                        placeholder="Answer"
                        rows={2}
                        value={faq.a || ""}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentPage.type === "about" && (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-philosophy-eyebrow"
                  >
                    Philosophy Eyebrow
                  </label>
                  <Input
                    id="content-manager-philosophy-eyebrow"
                    onChange={(e) =>
                      handleUpdateField("eyebrow", e.target.value)
                    }
                    value={currentData.eyebrow || ""}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-page-headline"
                  >
                    Page Headline
                  </label>
                  <Input
                    id="content-manager-page-headline"
                    onChange={(e) =>
                      handleUpdateField("headline", e.target.value)
                    }
                    value={currentData.headline || ""}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-introductory-lead-paragraph"
                  >
                    Introductory Lead Paragraph
                  </label>
                  <textarea
                    className="w-full border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    id="content-manager-introductory-lead-paragraph"
                    onChange={(e) => handleUpdateField("lead", e.target.value)}
                    rows={2}
                    value={currentData.lead || ""}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                    Story Sections
                  </p>
                  {(currentData.sections || []).map((sec, idx) => (
                    <div
                      className="border border-border p-4 rounded-lg bg-muted/20 space-y-2"
                      // biome-ignore lint/suspicious/noArrayIndexKey: editor rows are positional; their text changes on every keystroke so it cannot be a stable key.
                      key={idx}
                    >
                      <Input
                        onChange={(e) => {
                          const sections = [...(currentData.sections ?? [])];
                          sections[idx] = {
                            ...sections[idx],
                            heading: e.target.value,
                          };
                          handleUpdateField("sections", sections);
                        }}
                        placeholder="Section Heading"
                        value={sec.heading || ""}
                      />
                      <textarea
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        onChange={(e) => {
                          const sections = [...(currentData.sections ?? [])];
                          sections[idx] = {
                            ...sections[idx],
                            body: e.target.value,
                          };
                          handleUpdateField("sections", sections);
                        }}
                        placeholder="Section Body"
                        rows={3}
                        value={sec.body || ""}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentPage.type === "policy" && (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-policy-title"
                  >
                    Policy Title
                  </label>
                  <Input
                    id="content-manager-policy-title"
                    onChange={(e) => handleUpdateField("title", e.target.value)}
                    value={currentData.title || ""}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="content-manager-policy-subtitle-summary"
                  >
                    Policy Subtitle / Summary
                  </label>
                  <Input
                    id="content-manager-policy-subtitle-summary"
                    onChange={(e) =>
                      handleUpdateField("subtitle", e.target.value)
                    }
                    value={currentData.subtitle || ""}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Policy Sections
                    </p>
                    <Button
                      className="gap-1"
                      onClick={() => {
                        const content = [...(currentData.content || [])];
                        content.push({
                          heading: "New Clause",
                          body: "Clause terms...",
                        });
                        handleUpdateField("content", content);
                      }}
                      size="xs"
                      variant="secondary"
                    >
                      <Plus size={12} /> Add Clause
                    </Button>
                  </div>

                  {(currentData.content || []).map((clause, idx) => (
                    <div
                      className="border border-border p-4 rounded-lg bg-muted/20 space-y-2"
                      // biome-ignore lint/suspicious/noArrayIndexKey: editor rows are positional; their text changes on every keystroke so it cannot be a stable key.
                      key={idx}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-ui text-muted-foreground">
                          Clause #{idx + 1}
                        </span>
                        <button
                          className="text-muted-foreground hover:text-destructive p-1"
                          onClick={() => {
                            const content = [...(currentData.content ?? [])];
                            content.splice(idx, 1);
                            handleUpdateField("content", content);
                          }}
                          type="button"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <Input
                        onChange={(e) => {
                          const content = [...(currentData.content ?? [])];
                          content[idx] = {
                            ...content[idx],
                            heading: e.target.value,
                          };
                          handleUpdateField("content", content);
                        }}
                        placeholder="Clause Heading"
                        value={clause.heading || ""}
                      />
                      <textarea
                        className="w-full border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                        onChange={(e) => {
                          const content = [...(currentData.content ?? [])];
                          content[idx] = {
                            ...content[idx],
                            body: e.target.value,
                          };
                          handleUpdateField("content", content);
                        }}
                        placeholder="Clause Body"
                        rows={3}
                        value={clause.body || ""}
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
