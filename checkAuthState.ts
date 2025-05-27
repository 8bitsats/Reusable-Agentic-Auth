import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";

/**
 * Action that checks the current Solana wallet authentication state
 */
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
      text.includes("am i connected") ||
      text.includes("check wallet")
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
      
      // Format public key for display (first 6 chars + last 4)
      const formattedKey = `${authState.walletPublicKey.substring(0, 6)}...${authState.walletPublicKey.substring(authState.walletPublicKey.length - 4)}`;
      
      await runtime.messageManager.createMemory({
        content: {
          text: `You're currently authenticated with your Solana wallet (${formattedKey}).\n\nYour session is valid for another ${hoursRemaining} hours and ${minutesRemaining} minutes on the ${authState.network} network.`
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
