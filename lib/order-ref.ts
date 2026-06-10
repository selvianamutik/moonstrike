import { createHash, randomUUID } from "crypto";

function referenceSuffix(seed?: string) {
  if (!seed) return randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return createHash("sha256").update(seed).digest("hex").slice(0, 6).toUpperCase();
}

export function createOrderReference(date = new Date(), seed?: string) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = referenceSuffix(seed);
  return `MS-${stamp}-${suffix}`;
}

export function createTransactionReference(date = new Date(), seed?: string) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = referenceSuffix(seed);
  return `TXN-${stamp}-${suffix}`;
}
