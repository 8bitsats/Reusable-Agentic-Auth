import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export async function encryptData(data: string, key: string): Promise<string> {
  // In a real implementation, this would use a proper encryption algorithm
  // For demonstration, we'll use a simple AES encryption
  
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

export async function decryptData(encryptedData: string, key: string): Promise<string> {
  // In a real implementation, this would use a proper decryption algorithm
  // For demonstration, we'll use a simple AES decryption
  
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
