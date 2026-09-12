export function normalizePgConnectionString(url: string): string {
  return url.replace(/^postgres:\/\//, "postgresql://");
}

// Neon exposes the same database through direct and transaction-pooled hosts.
export function directPgConnectionString(connectionString: string): string {
  const url = new URL(normalizePgConnectionString(connectionString));
  if (url.hostname.endsWith(".neon.tech")) {
    url.hostname = url.hostname.replace("-pooler.", ".");
  }
  return url.toString();
}
