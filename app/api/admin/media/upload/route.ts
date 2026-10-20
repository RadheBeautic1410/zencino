import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import {
  isAllowedMimeType,
  isVideoMimeType,
  maxUploadBytes,
  saveMediaAsset,
} from "@/lib/media/storage";

function positiveInt(value: FormDataEntryValue | null): number | undefined {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = String(formData.get("altText") ?? "");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "A valid file is required" },
        { status: 400 }
      );
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type || "unknown"} is not supported. Use JPG, PNG, WebP, AVIF, SVG, MP4, WebM, or MOV.`,
        },
        { status: 400 }
      );
    }

    const maxBytes = maxUploadBytes(file.type);
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `File exceeds maximum size of ${maxBytes / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as File).name || "upload.png";

    const asset = await saveMediaAsset({
      filename,
      buffer,
      mimeType: file.type,
      altText,
      // Only videos take browser-reported dimensions; images are parsed server-side.
      ...(isVideoMimeType(file.type) && {
        customWidth: positiveInt(formData.get("width")),
        customHeight: positiveInt(formData.get("height")),
      }),
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
