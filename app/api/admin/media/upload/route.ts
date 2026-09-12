import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { isAllowedMimeType, saveMediaAsset } from "@/lib/media/storage";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = String(formData.get("altText") ?? "");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "A valid file is required" }, { status: 400 });
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported. Use JPG, PNG, WebP, AVIF, or SVG.` },
        { status: 400 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds maximum size of 10MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as File).name || "upload.png";

    const asset = await saveMediaAsset({
      filename,
      buffer,
      mimeType: file.type,
      altText,
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
