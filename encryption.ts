import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Encrypts data using AES-256-CBC
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data in format "iv:encrypted"
 */
export async function encryptData(data: string, key: string): Promise<string> {
  // Ensure key is exactly 32 bytes (256 bits) for AES-256
  const normalizedKey = Buffer.from(key.padEnd(32).slice(0, 32));
  
  // Generate a random initialization vector
  const iv = randomBytes(16);
  
  // Create cipher
  const cipher = createCipheriv("aes-256-cbc", normalizedKey, iv);
  
  // Encrypt data
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return IV and encrypted data
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts data using AES-256-CBC
 * @param encryptedData Encrypted data in format "iv:encrypted"
 * @param key Encryption key
 * @returns Decrypted data
 */
export async function decryptData(encryptedData: string, key: string): Promise<string> {
  // Ensure key is exactly 32 bytes (256 bits) for AES-256
  const normalizedKey = Buffer.from(key.padEnd(32).slice(0, 32));
  
  // Split IV and encrypted data
  const [ivHex, encrypted] = encryptedData.split(":");
  
  // Convert IV from hex to Buffer
  const iv = Buffer.from(ivHex, "hex");
  
  // Create decipher
  const decipher = createDecipheriv("aes-256-cbc", normalizedKey, iv);
  
  // Decrypt data
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
