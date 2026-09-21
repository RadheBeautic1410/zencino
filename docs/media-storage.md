# Image storage

Set `STORAGE_LOCATION=local` (the default) to save new images in `public/uploads`.
Set `STORAGE_LOCATION=firebase` to upload new images to Firebase Storage.

For Firebase, provision a Storage bucket and configure these server environment variables:

```dotenv
STORAGE_LOCATION=firebase
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use the actual bucket name from Firebase Console (older buckets may end in `.appspot.com`), without `gs://`.
The service account must have permission to create and read objects in that bucket.
Alternatively, omit the email/private key fields and use Application Default Credentials, such as a server-only `GOOGLE_APPLICATION_CREDENTIALS` JSON file path.
Never put service account credentials in `NEXT_PUBLIC_` variables or commit them.
Restart the application after changing environment variables.

The Firebase Admin SDK writes images under `uploads/` and stores their token-bearing download URLs in the existing `storageKey` database column. These URLs allow anyone possessing the link to view the image; no public bucket access is required. All current upload flows use this setting, including product images, payment proofs and return photos.

Existing images are not migrated: local keys keep resolving to `/uploads/`, and Firebase URLs keep working after switching back to local. Keep existing local files on the server. Checksum deduplication continues to reuse existing images in their original location. No database migration is required.

Reference: [Firebase Admin Storage documentation](https://firebase.google.com/docs/storage/admin/start).
