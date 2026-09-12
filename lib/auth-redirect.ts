export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/post-auth"
) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\%]/.test(value) ||
    [...value].some((character) => character.charCodeAt(0) <= 32)
  ) {
    return fallback;
  }
  const url = new URL(value, "https://zencino.invalid");
  if (
    url.origin !== "https://zencino.invalid" ||
    url.pathname === "/login" ||
    url.pathname.startsWith("/api/")
  ) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
