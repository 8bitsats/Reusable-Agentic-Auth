import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";
import { WalletAdapter } from "../services/walletAdapter";
import { AUTH_STATE_MANAGER_SERVICE_TYPE, WALLET_ADAPTER_SERVICE_TYPE } from "../types";

export const signTransactionAction: Action = {
  name: "SIGN_SOLANA_TRANSACTION",
  similes: ["SEND_SOL", "TRANSFER_TOKENS"],
  description: "Signs a Solana transaction using the authenticated wallet",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("sign transaction") ||
      text.includes("send sol") ||
      text.includes("transfer tokens") ||
      text.includes("send tokens")
    );
  },
  
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      // Get services
      const authStateManager = runtime.getService(AUTH_STATE_MANAGER_SERVICE_TYPE) as AuthStateManager;
      const walletAdapter = runtime.getService(WALLET_ADAPTER_SERVICE_TYPE) as WalletAdapter;
      
      // Check for existing auth state
      const serviceKey = "solana-auth";
      const authState = await authStateManager.loadAuthState(serviceKey);
      
      if (!authState || !authStateManager.isValid(authState)) {
        await runtime.messageManager.createMemory({
          content: {
            text: "You need to authenticate with your Solana wallet before signing a transaction. Would you like to authenticate now?"
          },
          userId: runtime.agentId,
          roomId: message.roomId,
        });
        
        return false;
      }
      
      // In a real implementation, we would parse the transaction details from the message
      // For demonstration, we'll simulate a transaction signing
      
      await runtime.messageManager.createMemory({
        content: {
          text: "I'll help you sign this transaction. Please review the transaction details when prompted by your wallet."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      // Simulate transaction signing
      const transactionSignature = await walletAdapter.requestSignature(
        authState.walletPublicKey,
        "Transaction data would go here in a real implementation"
      );
      
      await runtime.messageManager.createMemory({
        content: {
          text: `Transaction signed successfully! Transaction signature: ${transactionSignature.substring(0, 8)}...`
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return true;
    } catch (error) {
      console.error("Transaction signing error:", error);
      
      await runtime.messageManager.createMemory({
        content: {
          text: "There was an error signing your transaction. Please try again later."
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
        content: { text: "Can you help me send 0.1 SOL to address abc123..." }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll help you sign this transaction.",
          action: "SIGN_SOLANA_TRANSACTION"
        }
      }
    ]
  ]
};
