import assert from "node:assert/strict";
import test from "node:test";
import { getMediaAssetUrl } from "../lib/media/url";

test("legacy local images retain their URLs when the storage provider changes", () => {
  assert.equal(
    getMediaAssetUrl("existing-image.webp"),
    "/uploads/existing-image.webp"
  );
});

test("Firebase download URLs preserve their object path and download token", () => {
  const url =
    "https://firebasestorage.googleapis.com/v0/b/example.firebasestorage.app/o/uploads%2Fimage.png?alt=media&token=example";
  assert.equal(getMediaAssetUrl(url), url);
});
