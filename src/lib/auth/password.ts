import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Passwords are never stored. We keep a salted scrypt hash: "scrypt:N:r:p:salt:hash". */
const N = 16384, R = 8, P = 1, KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join(":");
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, r, p, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = scryptSync(password, Buffer.from(salt, "base64"), expected.length, { N: +n, r: +r, p: +p });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
