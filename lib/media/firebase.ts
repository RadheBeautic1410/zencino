import { randomUUID } from "node:crypto";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getDownloadURL, getStorage } from "firebase-admin/storage";
import { env } from "@/lib/env";

export async function uploadFirebaseImage(
  key: string,
  buffer: Buffer,
  mimeType: string
) {
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
                privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
              })
            : applicationDefault(),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      },
      appName
    );
  const file = getStorage(app).bucket().file(`uploads/${key}`);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      metadata: { firebaseStorageDownloadTokens: randomUUID() },
    },
  });
  return getDownloadURL(file);
}
