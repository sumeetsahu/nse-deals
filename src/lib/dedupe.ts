import { createHash } from "node:crypto";

export function sha256Hex(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}
