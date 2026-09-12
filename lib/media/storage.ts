import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { mediaAssets } from "@/db/schema/catalog";
import { db } from "@/lib/db";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

export function isAllowedMimeType(mime: string): boolean {
  return mime in ALLOWED_MIME_TYPES;
}

export function parseImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      if (buffer.readUInt32BE(0) === 0x89504e47 && buffer.readUInt32BE(4) === 0x0d0a1a0a) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width > 0 && height > 0) return { width, height };
      }
    }

    if (mimeType === "image/jpeg" && buffer.length >= 4) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mimeType === "image/webp" && buffer.length >= 30) {
      const riff = buffer.toString("ascii", 0, 4);
      const webp = buffer.toString("ascii", 8, 12);
      if (riff === "RIFF" && webp === "WEBP") {
        const format = buffer.toString("ascii", 12, 16);
        if (format === "VP8 " && buffer.length >= 30) {
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          if (width > 0 && height > 0) return { width, height };
        } else if (format === "VP8L" && buffer.length >= 25) {
          const b1 = buffer[21];
          const b2 = buffer[22];
          const b3 = buffer[23];
          const b4 = buffer[24];
          const width = 1 + (((b2 & 0x3f) << 8) | b1);
          const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
          if (width > 0 && height > 0) return { width, height };
        } else if (format === "VP8X" && buffer.length >= 30) {
          const width = 1 + buffer.readUIntLE(24, 3);
          const height = 1 + buffer.readUIntLE(27, 3);
          if (width > 0 && height > 0) return { width, height };
        }
      }
    }
  } catch {
    // fallback below
  }

  // Fallback sensible dimensions for SVG or unrecognized header
  return { width: 1200, height: 1200 };
}

export interface SaveMediaOptions {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  altText?: string;
  source?: string;
  rightsNote?: string;
  customWidth?: number;
  customHeight?: number;
}

export async function saveMediaAsset(options: SaveMediaOptions) {
  const {
    filename,
    buffer,
    mimeType,
    altText = "",
    source = "owner",
    rightsNote = "",
    customWidth,
    customHeight,
  } = options;

  if (!isAllowedMimeType(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const checksum = createHash("sha256").update(buffer).digest("hex");

  // Check if identical asset already exists
  const [existing] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.checksum, checksum))
    .limit(1);

  if (existing) {
    return existing;
  }

  const ext = ALLOWED_MIME_TYPES[mimeType] || path.extname(filename) || ".png";
  const uniqueKey = `${Date.now()}-${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueKey);
  await writeFile(filePath, buffer);

  const detectedDims = parseImageDimensions(buffer, mimeType);
  const width = customWidth || detectedDims.width;
  const height = customHeight || detectedDims.height;

  const [asset] = await db
    .insert(mediaAssets)
    .values({
      storageKey: uniqueKey,
      originalFilename: filename,
      mimeType,
      bytes: buffer.length,
      width,
      height,
      checksum,
      altText: altText || filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      source,
      rightsNote,
    })
    .returning();

  return asset;
}

export function getMediaAssetUrl(storageKey: string): string {
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }
  return `/uploads/${storageKey}`;
}
