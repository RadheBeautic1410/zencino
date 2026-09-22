import { and, desc, eq, max } from "drizzle-orm";
import {
  type ContentPage,
  type ContentVersion,
  contentPages,
  contentVersions,
} from "@/db/schema/content";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export * from "./content-defaults";

import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_POLICIES,
} from "./content-defaults";

export const CONTENT_PAGE_TYPES = [
  "homepage",
  "faq",
  "about",
  "policy",
] as const;

export type ContentPageType = (typeof CONTENT_PAGE_TYPES)[number];

export function isContentPageType(value: string): value is ContentPageType {
  return (CONTENT_PAGE_TYPES as readonly string[]).includes(value);
}

// Core Content Retrieval Service with Fallback

export async function getPublishedContent<T>(
  slug: string,
  type: ContentPageType
): Promise<{
  data: T;
  version: number;
  publishedAt: Date | null;
  isDefault: boolean;
}> {
  try {
    const [page] = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, slug))
      .limit(1);

    if (page?.currentVersionId) {
      const [version] = await db
        .select()
        .from(contentVersions)
        .where(
          and(
            eq(contentVersions.id, page.currentVersionId),
            eq(contentVersions.status, "published")
          )
        )
        .limit(1);

      if (version?.data) {
        return {
          data: version.data as unknown as T,
          version: version.version,
          publishedAt: version.publishedAt,
          isDefault: false,
        };
      }
    }
  } catch (error) {
    console.error(
      `[content] error reading published content for slug '${slug}':`,
      error
    );
  }

  // Graceful fallback
  let fallback: unknown;
  if (type === "homepage") {
    fallback = DEFAULT_HOMEPAGE_CONTENT;
  } else if (type === "faq") {
    fallback = DEFAULT_FAQ_CONTENT;
  } else if (type === "about") {
    fallback = DEFAULT_ABOUT_CONTENT;
  } else if (type === "policy") {
    const policyKey = slug.replace("policies-", "");
    fallback = DEFAULT_POLICIES[policyKey] || DEFAULT_POLICIES.terms;
  } else {
    fallback = {};
  }

  return {
    data: fallback as T,
    version: 0,
    publishedAt: null,
    isDefault: true,
  };
}

// Administrative Content Services

export async function listAllContentPages(): Promise<
  Array<
    ContentPage & {
      currentVersionNumber: number | null;
      publishedAt: Date | null;
    }
  >
> {
  const pages = await db.select().from(contentPages).orderBy(contentPages.slug);

  const result = [];
  for (const p of pages) {
    let currentVersionNumber: number | null = null;
    let publishedAt: Date | null = null;

    if (p.currentVersionId) {
      const [v] = await db
        .select()
        .from(contentVersions)
        .where(eq(contentVersions.id, p.currentVersionId))
        .limit(1);
      if (v) {
        currentVersionNumber = v.version;
        publishedAt = v.publishedAt;
      }
    }

    result.push({
      ...p,
      currentVersionNumber,
      publishedAt,
    });
  }

  return result;
}

export async function getContentVersionHistory(slug: string): Promise<{
  page: ContentPage | null;
  versions: ContentVersion[];
}> {
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.slug, slug))
    .limit(1);

  if (!page) {
    return { page: null, versions: [] };
  }

  const versions = await db
    .select()
    .from(contentVersions)
    .where(eq(contentVersions.pageId, page.id))
    .orderBy(desc(contentVersions.version));

  return { page, versions };
}

export async function saveContentVersionDraft(input: {
  slug: string;
  title: string;
  type: ContentPageType;
  data: Record<string, unknown>;
  summary?: string;
  authorId?: string;
}): Promise<ContentVersion> {
  let [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.slug, input.slug))
    .limit(1);

  if (!page) {
    const [newPage] = await db
      .insert(contentPages)
      .values({
        slug: input.slug,
        title: input.title,
        type: input.type,
      })
      .returning();
    page = newPage;
  }

  // Calculate next version
  const [maxVer] = await db
    .select({ max: max(contentVersions.version) })
    .from(contentVersions)
    .where(eq(contentVersions.pageId, page.id));

  const nextVersion = (maxVer?.max ?? 0) + 1;

  const [version] = await db
    .insert(contentVersions)
    .values({
      pageId: page.id,
      version: nextVersion,
      title: input.title,
      summary: input.summary || `Draft version ${nextVersion}`,
      data: input.data,
      status: "draft",
      authorId: input.authorId ?? null,
    })
    .returning();

  return version;
}

export async function publishContentVersion(input: {
  versionId: string;
  actorId?: string;
  actorEmail?: string;
}): Promise<{ success: boolean; page: ContentPage; version: ContentVersion }> {
  return await db.transaction(async (tx) => {
    const [version] = await tx
      .select()
      .from(contentVersions)
      .where(eq(contentVersions.id, input.versionId))
      .limit(1);

    if (!version) {
      throw new Error(`Content version ${input.versionId} not found`);
    }

    const [page] = await tx
      .select()
      .from(contentPages)
      .where(eq(contentPages.id, version.pageId))
      .limit(1);

    if (!page) {
      throw new Error(`Content page ${version.pageId} not found`);
    }

    // Mark version as published
    const now = new Date();
    const [updatedVersion] = await tx
      .update(contentVersions)
      .set({
        status: "published",
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(contentVersions.id, version.id))
      .returning();

    // Update page pointer
    const [updatedPage] = await tx
      .update(contentPages)
      .set({
        currentVersionId: updatedVersion.id,
        updatedAt: now,
      })
      .where(eq(contentPages.id, page.id))
      .returning();

    await audit({
      action: "content.publish",
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      entityType: "content_page",
      entityId: page.id,
      description: `Published version ${version.version} of content page '${page.slug}'`,
      metadata: {
        pageSlug: page.slug,
        versionId: version.id,
        version: version.version,
      },
    });

    return {
      success: true,
      page: updatedPage,
      version: updatedVersion,
    };
  });
}
