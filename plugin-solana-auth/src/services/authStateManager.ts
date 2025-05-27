import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { encryptData, decryptData } from "../utils/encryption";
import { storeData, retrieveData } from "../utils/storage";
import { AUTH_STATE_MANAGER_SERVICE_TYPE, AuthState } from "../types";

export class AuthStateManager implements Service {
  type = AUTH_STATE_MANAGER_SERVICE_TYPE;
  name = "solana-auth-state-manager";
  description = "Manages Solana wallet authentication state";
  
  private runtime: IAgentRuntime;
  private authCache: Record<string, AuthState> = {};
  
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
  }
  
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
  }
  
  async loadAuthState(serviceKey: string): Promise<AuthState | null> {
    // Check memory cache first
    if (this.authCache[serviceKey]) {
      const cachedState = this.authCache[serviceKey];
      if (this.isValid(cachedState)) {
        return cachedState;
      }
    }
    
    // Try loading from persistent storage
    const storageType = this.runtime.getSetting("authStateStorageType") || "encrypted-file";
    const encryptedState = await retrieveData(serviceKey, storageType, this.runtime);
    
    if (!encryptedState) {
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
        this.authCache[serviceKey] = authState;
        return authState;
      }
      
      // Try to refresh if possible
      if (authState.refreshToken && this.runtime.getSetting("autoRefresh") === true) {
        const refreshedState = await this.refreshAuthState(serviceKey, authState);
        if (refreshedState) {
          return refreshedState;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error parsing auth state:", error);
      return null;
    }
  }
  
  async refreshAuthState(serviceKey: string, authState: AuthState): Promise<AuthState | null> {
    try {
      // Implement refresh logic here
      // This would typically involve making a request to refresh the token
      
      // For demonstration purposes, we'll just extend the expiration
      const refreshedState: AuthState = {
        ...authState,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      
      await this.saveAuthState(serviceKey, refreshedState);
      return refreshedState;
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      return null;
    }
  }
  
  isValid(authState: AuthState): boolean {
    return Date.now() < authState.expiresAt;
  }
  
  async clearAuthState(serviceKey: string): Promise<void> {
    delete this.authCache[serviceKey];
    
    const storageType = this.runtime.getSetting("authStateStorageType") || "encrypted-file";
    await storeData(serviceKey, null, storageType, this.runtime);
  }
}
