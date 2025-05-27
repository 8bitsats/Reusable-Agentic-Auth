import { randomBytes } from "crypto";

/**
 * Generates a random nonce for authentication
 * @returns Hexadecimal nonce string
 */
export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Validates a Solana public key format
 * @param publicKey Public key to validate
 * @returns True if the public key is valid, false otherwise
 */
export function validatePublicKey(publicKey: string): boolean {
  // In a real implementation, this would validate the public key format
  // For demonstration, we'll do a simple check
  
  // Check if the key is a valid base58 string of the correct length
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(publicKey);
}

/**
 * Validates an authentication state
 * @param authState Authentication state to validate
 * @returns True if the authentication state is valid, false otherwise
 */
export function validateAuthState(authState: any): boolean {
  // Check if the auth state has all required fields
  if (!authState || 
      typeof authState !== 'object' ||
      !authState.walletPublicKey ||
      !authState.signature ||
      !authState.timestamp ||
      !authState.expiresAt ||
      !Array.isArray(authState.permissions) ||
      !authState.network) {
    return false;
  }
  
  // Check if the public key is valid
  if (!validatePublicKey(authState.walletPublicKey)) {
    return false;
  }
  
  // Check if the timestamp is valid
  if (typeof authState.timestamp !== 'number' || 
      authState.timestamp <= 0 ||
      authState.timestamp > Date.now()) {
    return false;
  }
  
  // Check if the expiration is valid
  if (typeof authState.expiresAt !== 'number' || 
      authState.expiresAt <= authState.timestamp) {
    return false;
  }
  
  return true;
}
