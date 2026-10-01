import { revalidatePath } from "next/cache";

/**
 * Catalog changes surface across many prerendered storefront pages (home
 * "Trending", collection rails, category and product pages). Purge the whole
 * route tree so none of them keep serving a stale cached copy.
 */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
