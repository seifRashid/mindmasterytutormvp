import { pbkdf2, randomBytes } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

/**
 * Hash a password using PBKDF2/SHA512.
 * @param password Plaintext password to hash.
 * @returns Combined salt and hash string: "salt:hash"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await pbkdf2Async(password, salt, 1000, 64, "sha512")).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Compare a plaintext password with a stored pbkdf2 hash.
 * @param password Plaintext password.
 * @param storedHash Hashed password in the format "salt:hash".
 * @returns Promise resolving to boolean indicating match status.
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = (await pbkdf2Async(password, salt, 1000, 64, "sha512")).toString("hex");
  return hash === verifyHash;
}
