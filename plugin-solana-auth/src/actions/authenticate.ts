import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";
import { WalletAdapter } from "../services/walletAdapter";
import { AUTH_STATE_MANAGER_SERVICE_TYPE, WALLET_ADAPTER_SERVICE_TYPE } from "../types";

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
      const authStateManager = runtime.getService(AUTH_STATE_MANAGER_SERVICE_TYPE) as AuthStateManager;
      const walletAdapter = runtime.getService(WALLET_ADAPTER_SERVICE_TYPE) as WalletAdapter;
      
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
