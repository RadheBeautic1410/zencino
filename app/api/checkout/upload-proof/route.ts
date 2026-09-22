import { NextResponse } from "next/server";
import {
  getMediaAssetUrl,
  isAllowedMimeType,
  saveMediaAsset,
} from "@/lib/media/storage";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_POLICIES,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request.headers);
    const limitCheck = checkRateLimit(
      clientId,
      "payment_proof",
      RATE_LIMIT_POLICIES.PAYMENT_PROOF
    );
    if (!limitCheck.success) {
      return NextResponse.json(
        {
          error: `Too many upload attempts. Please wait ${Math.ceil(limitCheck.resetMs / 1000)} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "A valid payment screenshot image file is required." },
        { status: 400 }
      );
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type} is not supported. Please upload a JPG, PNG, or WebP screenshot.`,
        },
        { status: 400 }
      );
    }

    // 5MB limit for payment screenshots
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Screenshot file exceeds maximum size of 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as File).name || "payment-proof.png";

    const asset = await saveMediaAsset({
      filename,
      buffer,
      mimeType: file.type,
      altText: "UPI Payment Transfer Screenshot",
      source: "customer_payment_proof",
    });

    return NextResponse.json({
      success: true,
      url: getMediaAssetUrl(asset.storageKey),
      assetId: asset.id,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to upload payment screenshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
