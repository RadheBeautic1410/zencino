/**
 * Utility to scrub and redact sensitive operational and financial data
 * (passwords, auth tokens, database URLs, full payment credentials)
 * before serialization to audit logs, telemetry, or external responses.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /auth/i,
  /cookie/i,
  /api[-_]?key/i,
  /database[-_]?url/i,
  /connection[-_]?string/i,
  /credit[-_]?card/i,
  /cvv/i,
];

/**
 * Recursively scrubs known sensitive keys from objects or strings.
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    // Redact connection strings containing postgresql:// or postgres://
    let redacted = input.replace(
      /(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)/gi,
      "$1[REDACTED]$3"
    );
    // Redact 16-digit card-like numbers
    redacted = redacted.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[REDACTED_CARD]");
    return redacted as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey && typeof value === "string") {
        output[key] = "[REDACTED]";
      } else if (isSensitiveKey && typeof value === "number") {
        output[key] = 0;
      } else {
        output[key] = redactSensitiveData(value);
      }
    }
    return output as T;
  }

  return input;
}
