import { Plugin } from "@elizaos/core";
import { AuthStateManager } from "./services/authStateManager";
import { WalletAdapter } from "./services/walletAdapter";
import { authenticateAction } from "./actions/authenticate";
import { checkAuthStateAction } from "./actions/checkAuthState";
import { signTransactionAction } from "./actions/signTransaction";

/**
 * Solana Auth Plugin for Eliza OS
 * 
 * This plugin provides wallet connection, authentication, and state management
 * capabilities for Solana blockchain interactions within Eliza OS agents.
 */
export const solanaAuthPlugin: Plugin = {
  name: "solana-auth",
  description: "Solana wallet authentication plugin for Eliza OS",
  services: [new AuthStateManager(), new WalletAdapter()],
  actions: [authenticateAction, checkAuthStateAction, signTransactionAction],
  // Configuration options with defaults
  config: {
    authStateStorageType: "encrypted-file", // Options: "encrypted-file", "database", "memory"
    authStateTTL: 86400, // Default: 24 hours in seconds
    autoRefresh: true,
    secureStorage: true,
  }
};

export default solanaAuthPlugin;
