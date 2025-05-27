import { randomBytes } from "crypto";

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

export function validatePublicKey(publicKey: string): boolean {
  // In a real implementation, this would validate the public key format
  // For demonstration, we'll do a simple check
  return publicKey.length > 0;
}
