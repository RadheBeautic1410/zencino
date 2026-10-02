import { randomUUID } from "node:crypto";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getDownloadURL, getStorage } from "firebase-admin/storage";
import { env } from "@/lib/env";

/**
 * Service account JSON holds both `private_key_id` (a short hex fingerprint)
 * and `private_key` (the PEM block). Pasting the former is an easy mistake, and
 * surfaces deep inside firebase-admin as an opaque "Failed to parse private
 * key", so check the shape here and say what is actually wrong.
 */
function toPrivateKey(value: string): string {
  const key = value.replace(/\\n/g, "\n").trim();
  if (!key.startsWith("-----BEGIN")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is not a PEM private key (missing the -----BEGIN----- header). " +
        "Copy the service account JSON's `private_key` field, not `private_key_id`."
    );
  }
  return key;
}

function getMediaBucket() {
  const appName = "zencino-media";
  const app =
    getApps().find((candidate) => candidate.name === appName) ??
    initializeApp(
      {
        credential:
          env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
            ? cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: toPrivateKey(env.FIREBASE_PRIVATE_KEY),
              })
            : applicationDefault(),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      },
      appName
    );
  return getStorage(app).bucket();
}

export async function uploadFirebaseImage(
  key: string,
  buffer: Buffer,
  mimeType: string
) {
  const file = getMediaBucket().file(`uploads/${key}`);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      metadata: { firebaseStorageDownloadTokens: randomUUID() },
    },
  });
  return getDownloadURL(file);
}

/**
 * Deletes an object given the download URL stored as the asset's storageKey,
 * e.g. https://firebasestorage.googleapis.com/v0/b/<bucket>/o/uploads%2F<key>?alt=media&token=...
 */
export async function deleteFirebaseImage(downloadUrl: string) {
  const match = new URL(downloadUrl).pathname.match(/\/o\/(.+)$/);
  if (!match) {
    throw new Error(`Unrecognised Firebase download URL: ${downloadUrl}`);
  }
  const objectPath = decodeURIComponent(match[1]);
  await getMediaBucket().file(objectPath).delete({ ignoreNotFound: true });
}
