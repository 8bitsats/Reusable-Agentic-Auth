# Solana Agent Authentication Plugin for Eliza OS

## Overview

This document outlines the design for a reusable authentication flow for Solana AI agents within the Eliza OS ecosystem. The solution is designed as a plugin that manages wallet connections and authentication state, allowing agents to maintain persistent authentication across sessions without requiring users to repeatedly authenticate.

## Architecture

The solution consists of three main components:

1. **Solana Auth Plugin**: A plugin for Eliza OS that provides wallet connection, authentication, and state management capabilities.
2. **Auth State Manager**: A service that handles secure storage and retrieval of authentication state.
3. **Action Handlers**: A set of actions that agents can use to interact with the authentication system.

### Plugin Structure

```
plugin-solana-auth/
├── src/
│   ├── index.ts                 # Main plugin entry point
│   ├── actions/                 # Action handlers
│   │   ├── authenticate.ts      # Authentication action
│   │   ├── checkAuthState.ts    # Auth state verification action
│   │   └── signTransaction.ts   # Transaction signing action
│   ├── services/                # Services
│   │   ├── authStateManager.ts  # Auth state management service
│   │   └── walletAdapter.ts     # Solana wallet adapter integration
│   ├── types.ts                 # Type definitions
│   └── utils/                   # Utility functions
│       ├── encryption.ts        # Encryption utilities
│       ├── storage.ts           # Storage utilities
│       └── validation.ts        # Validation utilities
├── package.json                 # Plugin dependencies
└── README.md                    # Plugin documentation
```

## Authentication Flow

The authentication flow is designed to minimize user interaction while maintaining security:

1. **Initial Authentication**:
   - Agent checks for existing valid authentication state
   - If no valid state exists, agent requests wallet connection
   - User connects wallet and signs a message to authenticate
   - Authentication state is securely stored for future use

2. **Subsequent Authentication**:
   - Agent checks for existing valid authentication state
   - If valid state exists, agent reuses it without user interaction
   - If state is expired but has a refresh token, agent automatically refreshes
   - Only if state is invalid or cannot be refreshed does the agent request new authentication

3. **State Management**:
   - Authentication state includes wallet public key, signature, timestamp, and expiration
   - State is encrypted before storage to protect sensitive information
   - State can be stored in various backends (file system, database, secure storage)
   - State includes TTL (Time To Live) for automatic expiration

## Core Components

### 1. SolanaAuthPlugin

The main plugin class that registers services and actions with the Eliza OS runtime.

```typescript
// src/index.ts
import { Plugin } from "@elizaos/core";
import { AuthStateManager } from "./services/authStateManager";
import { authenticateAction } from "./actions/authenticate";
import { checkAuthStateAction } from "./actions/checkAuthState";
import { signTransactionAction } from "./actions/signTransaction";

export const solanaAuthPlugin: Plugin = {
  name: "solana-auth",
  description: "Solana wallet authentication plugin for Eliza OS",
  services: [AuthStateManager],
  actions: [authenticateAction, checkAuthStateAction, signTransactionAction],
  // Configuration options
  config: {
    authStateStorageType: "encrypted-file", // Options: "encrypted-file", "database", "memory"
    authStateTTL: 86400, // Default: 24 hours in seconds
    autoRefresh: true,
    secureStorage: true,
  }
};

export default solanaAuthPlugin;
```

### 2. AuthStateManager

A service that manages the authentication state, including storage, retrieval, validation, and refreshing.

```typescript
// src/services/authStateManager.ts
import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { encryptData, decryptData } from "../utils/encryption";
import { storeData, retrieveData } from "../utils/storage";

export interface AuthState {
  walletPublicKey: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
  refreshToken?: string;
  permissions: string[];
  network: string;
}

export class AuthStateManager implements Service {
  type = "SOLANA_AUTH_STATE_MANAGER" as ServiceType;
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
```

### 3. WalletAdapter

A service that integrates with Solana wallet adapters to handle wallet connections and signatures.

```typescript
// src/services/walletAdapter.ts
import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";
import { generateNonce } from "../utils/validation";

export class WalletAdapter implements Service {
  type = "SOLANA_WALLET_ADAPTER" as ServiceType;
  name = "solana-wallet-adapter";
  description = "Integrates with Solana wallet adapters";
  
  private runtime: IAgentRuntime;
  private connection: Connection | null = null;
  
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    
    // Initialize Solana connection
    const network = this.runtime.getSetting("SOLANA_NETWORK") || "mainnet-beta";
    const endpoint = this.getEndpointForNetwork(network);
    this.connection = new Connection(endpoint, "confirmed");
  }
  
  private getEndpointForNetwork(network: string): string {
    switch (network) {
      case "mainnet-beta":
        return "https://api.mainnet-beta.solana.com";
      case "devnet":
        return "https://api.devnet.solana.com";
      case "testnet":
        return "https://api.testnet.solana.com";
      default:
        return network; // Assume it's a custom RPC URL
    }
  }
  
  async connectWallet(): Promise<{ publicKey: string }> {
    // In a real implementation, this would interact with the wallet adapter
    // For demonstration, we'll simulate a successful connection
    return {
      publicKey: "simulated-public-key"
    };
  }
  
  async requestSignature(publicKey: string, message: string): Promise<string> {
    // In a real implementation, this would request a signature from the wallet
    // For demonstration, we'll simulate a successful signature
    return "simulated-signature";
  }
  
  async generateAuthMessage(publicKey: string): Promise<string> {
    const nonce = generateNonce();
    const timestamp = Date.now();
    
    return `Sign this message to authenticate with ${this.runtime.character.name}.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\nPublic Key: ${publicKey}`;
  }
  
  async verifySignature(publicKey: string, message: string, signature: string): Promise<boolean> {
    // In a real implementation, this would verify the signature
    // For demonstration, we'll simulate a successful verification
    return true;
  }
}
```

### 4. Authentication Action

An action that handles the authentication flow.

```typescript
// src/actions/authenticate.ts
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";
import { WalletAdapter } from "../services/walletAdapter";

export const authenticateAction: Action = {
  name: "AUTHENTICATE_SOLANA",
  similes: ["CONNECT_WALLET", "LOGIN_SOLANA"],
  description: "Authenticates the user with their Solana wallet",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("connect wallet") ||
      text.includes("authenticate") ||
      text.includes("login") ||
      text.includes("sign in")
    );
  },
  
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      // Get services
      const authStateManager = runtime.getService("SOLANA_AUTH_STATE_MANAGER") as AuthStateManager;
      const walletAdapter = runtime.getService("SOLANA_WALLET_ADAPTER") as WalletAdapter;
      
      // Check for existing auth state
      const serviceKey = "solana-auth";
      const existingAuth = await authStateManager.loadAuthState(serviceKey);
      
      if (existingAuth && authStateManager.isValid(existingAuth)) {
        // Already authenticated
        await runtime.messageManager.createMemory({
          content: {
            text: "You're already authenticated with your Solana wallet. Your session is valid and secure."
          },
          userId: runtime.agentId,
          roomId: message.roomId,
        });
        
        return true;
      }
      
      // Need to authenticate
      await runtime.messageManager.createMemory({
        content: {
          text: "I'll help you authenticate with your Solana wallet. Please connect your wallet when prompted."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      // Connect wallet
      const wallet = await walletAdapter.connectWallet();
      
      // Generate authentication message
      const authMessage = await walletAdapter.generateAuthMessage(wallet.publicKey);
      
      await runtime.messageManager.createMemory({
        content: {
          text: `Please sign this message to authenticate:\n\n${authMessage}`
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      // Request signature
      const signature = await walletAdapter.requestSignature(wallet.publicKey, authMessage);
      
      // Verify signature
      const isValid = await walletAdapter.verifySignature(wallet.publicKey, authMessage, signature);
      
      if (!isValid) {
        await runtime.messageManager.createMemory({
          content: {
            text: "Authentication failed. The signature could not be verified."
          },
          userId: runtime.agentId,
          roomId: message.roomId,
        });
        
        return false;
      }
      
      // Save auth state
      const authState = {
        walletPublicKey: wallet.publicKey,
        signature,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        permissions: ["transfer", "sign"],
        network: runtime.getSetting("SOLANA_NETWORK") || "mainnet-beta"
      };
      
      await authStateManager.saveAuthState(serviceKey, authState);
      
      await runtime.messageManager.createMemory({
        content: {
          text: "Authentication successful! Your wallet is now connected and your session is securely saved for future use."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return true;
    } catch (error) {
      console.error("Authentication error:", error);
      
      await runtime.messageManager.createMemory({
        content: {
          text: "There was an error during authentication. Please try again later."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you help me connect my Solana wallet?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll help you authenticate with your Solana wallet.",
          action: "AUTHENTICATE_SOLANA"
        }
      }
    ]
  ]
};
```

### 5. Check Auth State Action

An action that checks the current authentication state.

```typescript
// src/actions/checkAuthState.ts
import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";

export const checkAuthStateAction: Action = {
  name: "CHECK_AUTH_STATE",
  similes: ["CHECK_WALLET", "AUTH_STATUS"],
  description: "Checks the current authentication state",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("check auth") ||
      text.includes("auth status") ||
      text.includes("wallet status") ||
      text.includes("am i connected")
    );
  },
  
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      // Get auth state manager
      const authStateManager = runtime.getService("SOLANA_AUTH_STATE_MANAGER") as AuthStateManager;
      
      // Check auth state
      const serviceKey = "solana-auth";
      const authState = await authStateManager.loadAuthState(serviceKey);
      
      if (!authState) {
        await runtime.messageManager.createMemory({
          content: {
            text: "You're not currently authenticated with your Solana wallet. Would you like to connect now?"
          },
          userId: runtime.agentId,
          roomId: message.roomId,
        });
        
        return true;
      }
      
      // Calculate time remaining
      const timeRemaining = authState.expiresAt - Date.now();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      await runtime.messageManager.createMemory({
        content: {
          text: `You're currently authenticated with your Solana wallet (${authState.walletPublicKey.substring(0, 6)}...${authState.walletPublicKey.substring(authState.walletPublicKey.length - 4)}).\n\nYour session is valid for another ${hoursRemaining} hours and ${minutesRemaining} minutes on the ${authState.network} network.`
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return true;
    } catch (error) {
      console.error("Error checking auth state:", error);
      
      await runtime.messageManager.createMemory({
        content: {
          text: "There was an error checking your authentication state. Please try again later."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Am I connected to my wallet?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Let me check your wallet connection status.",
          action: "CHECK_AUTH_STATE"
        }
      }
    ]
  ]
};
```

## Utility Functions

### Encryption Utilities

```typescript
// src/utils/encryption.ts
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
```

### Storage Utilities

```typescript
// src/utils/storage.ts
import { IAgentRuntime } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";

export async function storeData(
  key: string,
  data: string | null,
  storageType: string,
  runtime: IAgentRuntime
): Promise<void> {
  switch (storageType) {
    case "encrypted-file":
      await storeInFile(key, data, runtime);
      break;
    case "database":
      await storeInDatabase(key, data, runtime);
      break;
    case "memory":
      // No persistent storage needed
      break;
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}

export async function retrieveData(
  key: string,
  storageType: string,
  runtime: IAgentRuntime
): Promise<string | null> {
  switch (storageType) {
    case "encrypted-file":
      return await retrieveFromFile(key, runtime);
    case "database":
      return await retrieveFromDatabase(key, runtime);
    case "memory":
      return null; // Memory-only storage doesn't persist
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}

async function storeInFile(key: string, data: string | null, runtime: IAgentRuntime): Promise<void> {
  const storageDir = path.join(process.cwd(), "data", "auth");
  
  // Ensure directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const filePath = path.join(storageDir, `${key}.auth`);
  
  if (data === null) {
    // Delete file if data is null
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  
  // Write data to file
  fs.writeFileSync(filePath, data, "utf8");
}

async function retrieveFromFile(key: string, runtime: IAgentRuntime): Promise<string | null> {
  const filePath = path.join(process.cwd(), "data", "auth", `${key}.auth`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, "utf8");
}

async function storeInDatabase(key: string, data: string | null, runtime: IAgentRuntime): Promise<void> {
  // In a real implementation, this would store data in a database
  // For demonstration, we'll use the runtime's database adapter
  
  const databaseAdapter = runtime.databaseAdapter;
  
  if (!databaseAdapter) {
    throw new Error("No database adapter available");
  }
  
  if (data === null) {
    // Delete data if null
    await databaseAdapter.delete("auth_state", { key });
    return;
  }
  
  // Store data
  await databaseAdapter.upsert("auth_state", { key, data });
}

async function retrieveFromDatabase(key: string, runtime: IAgentRuntime): Promise<string | null> {
  // In a real implementation, this would retrieve data from a database
  // For demonstration, we'll use the runtime's database adapter
  
  const databaseAdapter = runtime.databaseAdapter;
  
  if (!databaseAdapter) {
    throw new Error("No database adapter available");
  }
  
  const result = await databaseAdapter.findOne("auth_state", { key });
  
  if (!result) {
    return null;
  }
  
  return result.data;
}
```

### Validation Utilities

```typescript
// src/utils/validation.ts
import { randomBytes } from "crypto";

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

export function validatePublicKey(publicKey: string): boolean {
  // In a real implementation, this would validate the public key format
  // For demonstration, we'll do a simple check
  return publicKey.length > 0;
}
```

## Integration with Eliza OS

### Character Configuration

To use the Solana Auth Plugin in an Eliza OS agent, add it to the character configuration:

```json
{
  "name": "Alice",
  "plugins": [
    "@elizaos/plugin-solana-auth"
  ],
  "settings": {
    "secrets": {
      "ENCRYPTION_KEY": "your-secure-encryption-key"
    },
    "solana-auth": {
      "authStateStorageType": "encrypted-file",
      "authStateTTL": 86400,
      "autoRefresh": true,
      "SOLANA_NETWORK": "mainnet-beta"
    }
  }
}
```

### Usage in Agent Conversations

The plugin enables agents to handle authentication-related conversations naturally:

```
User: "Can you help me connect my Solana wallet?"
Agent: "I'll help you authenticate with your Solana wallet. Please connect your wallet when prompted."
[Wallet connection flow]
Agent: "Authentication successful! Your wallet is now connected and your session is securely saved for future use."

User: "Can you check if I'm still connected?"
Agent: "You're currently authenticated with your Solana wallet (ABC123...XYZ). Your session is valid for another 23 hours and 45 minutes on the mainnet-beta network."
```

## Security Considerations

1. **Encryption**: All sensitive data is encrypted before storage using AES-256-CBC.
2. **Secure Storage**: Multiple storage options are available, with encrypted file storage as the default.
3. **Time-Limited Sessions**: Authentication states have a configurable TTL to limit exposure.
4. **Minimal Data Storage**: Only essential information is stored, minimizing the risk of data exposure.
5. **Refresh Tokens**: Support for refresh tokens allows for secure session extension without requiring re-authentication.

## Extensibility

The plugin is designed to be extensible in several ways:

1. **Storage Backends**: Support for different storage backends (file, database, memory).
2. **Wallet Adapters**: Can be extended to support different wallet providers.
3. **Authentication Methods**: The authentication flow can be customized for different use cases.
4. **Network Support**: Works with different Solana networks (mainnet, devnet, testnet).

## Conclusion

This design provides a comprehensive solution for reusable authentication in Solana AI agents within the Eliza OS ecosystem. By securely storing and managing authentication state, agents can provide a seamless user experience without compromising security.

The implementation follows Eliza OS plugin architecture best practices and integrates with the agent runtime, services, and actions system to provide a cohesive solution that can be easily adopted by any Eliza OS agent.
