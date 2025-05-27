import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { encryptData, decryptData } from "../utils/encryption";
import { storeData, retrieveData } from "../utils/storage";

/**
 * Interface representing the authentication state for a Solana wallet
 */
export interface AuthState {
  walletPublicKey: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
  refreshToken?: string;
  permissions: string[];
  network: string;
}

/**
 * Service that manages the authentication state, including storage, retrieval,
 * validation, and refreshing of Solana wallet authentication.
 */
export class AuthStateManager implements Service {
  type = "SOLANA_AUTH_STATE_MANAGER" as ServiceType;
  name = "solana-auth-state-manager";
  description = "Manages Solana wallet authentication state";
  
  private runtime: IAgentRuntime;
  private authCache: Record<string, AuthState> = {};
  
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    console.log("Initializing Solana Auth State Manager");
  }
  
  /**
   * Saves the authentication state securely
   * @param serviceKey Unique identifier for the service
   * @param authState Authentication state to save
   */
  async saveAuthState(serviceKey: string, authState: AuthState): Promise<void> {
    // Cache in memory
    this.authCache[serviceKey] = authState;
    
    // Encrypt sensitive data
    const encryptedState = await encryptData(
      JSON.stringify(authState),
      this.runtime.getSetting("ENCRYPTION_KEY") || "default-key"
    );
    
    // Store in persistent storage
    const storageType = this.runtime.getSetting("authStateStorageType") || "encrypted-file";
    await storeData(serviceKey, encryptedState, storageType, this.runtime);
    
    console.log(`Auth state saved for ${serviceKey}`);
  }
  
  /**
   * Loads the authentication state if it exists and is valid
   * @param serviceKey Unique identifier for the service
   * @returns The authentication state or null if not found or invalid
   */
  async loadAuthState(serviceKey: string): Promise<AuthState | null> {
    // Check memory cache first
    if (this.authCache[serviceKey]) {
      const cachedState = this.authCache[serviceKey];
      if (this.isValid(cachedState)) {
        console.log(`Using cached auth state for ${serviceKey}`);
        return cachedState;
      }
    }
    
    // Try loading from persistent storage
    const storageType = this.runtime.getSetting("authStateStorageType") || "encrypted-file";
    const encryptedState = await retrieveData(serviceKey, storageType, this.runtime);
    
    if (!encryptedState) {
      console.log(`No auth state found for ${serviceKey}`);
      return null;
    }
    
    // Decrypt data
    const decryptedState = await decryptData(
      encryptedState,
      this.runtime.getSetting("ENCRYPTION_KEY") || "default-key"
    );
    
    try {
      const authState = JSON.parse(decryptedState) as AuthState;
      
      // Validate and cache if still valid
      if (this.isValid(authState)) {
        console.log(`Loaded valid auth state for ${serviceKey}`);
        this.authCache[serviceKey] = authState;
        return authState;
      }
      
      // Try to refresh if possible
      if (authState.refreshToken && this.runtime.getSetting("autoRefresh") === true) {
        console.log(`Attempting to refresh auth state for ${serviceKey}`);
        const refreshedState = await this.refreshAuthState(serviceKey, authState);
        if (refreshedState) {
          return refreshedState;
        }
      }
      
      console.log(`Auth state for ${serviceKey} is expired and couldn't be refreshed`);
      return null;
    } catch (error) {
      console.error("Error parsing auth state:", error);
      return null;
    }
  }
  
  /**
   * Refreshes an expired authentication state if possible
   * @param serviceKey Unique identifier for the service
   * @param authState Expired authentication state
   * @returns Refreshed authentication state or null if refresh failed
   */
  async refreshAuthState(serviceKey: string, authState: AuthState): Promise<AuthState | null> {
    try {
      // Implement refresh logic here
      // This would typically involve making a request to refresh the token
      
      // For demonstration purposes, we'll just extend the expiration
      const ttl = parseInt(this.runtime.getSetting("authStateTTL") || "86400", 10) * 1000;
      
      const refreshedState: AuthState = {
        ...authState,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      
      await this.saveAuthState(serviceKey, refreshedState);
      console.log(`Auth state refreshed for ${serviceKey}`);
      return refreshedState;
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      return null;
    }
  }
  
  /**
   * Checks if an authentication state is still valid
   * @param authState Authentication state to validate
   * @returns True if the authentication state is valid, false otherwise
   */
  isValid(authState: AuthState): boolean {
    return Date.now() < authState.expiresAt;
  }
  
  /**
   * Clears the authentication state
   * @param serviceKey Unique identifier for the service
   */
  async clearAuthState(serviceKey: string): Promise<void> {
    delete this.authCache[serviceKey];
    
    const storageType = this.runtime.getSetting("authStateStorageType") || "encrypted-file";
    await storeData(serviceKey, null, storageType, this.runtime);
    
    console.log(`Auth state cleared for ${serviceKey}`);
  }
}
