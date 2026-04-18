import crypto from "node:crypto";

export function createShareToken() {
  return crypto.randomBytes(24).toString("hex");
}
