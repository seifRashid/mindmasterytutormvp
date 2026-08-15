import { createHash } from "crypto";

/**
 * Generate a deterministic UUID from a string (or return it if it is already a UUID).
 */
export function toUuid(str: string): string {
  if (!str) return "";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str;
  }
  const hash = createHash("md5").update(str).digest("hex");
  const parts = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "3" + hash.substring(13, 16),
    "8" + hash.substring(17, 20),
    hash.substring(20, 32),
  ];
  return parts.join("-");
}

/**
 * In production all IDs are real UUIDs — return as-is.
 * Kept for call-site compatibility.
 */
export function fromUuid(uuid: string): string {
  return uuid;
}

