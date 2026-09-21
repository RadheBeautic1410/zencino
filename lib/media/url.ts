// Shared by server queries and client components; never import server credentials here.
export function getMediaAssetUrl(storageKey: string): string {
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }
  return `/uploads/${storageKey}`;
}
