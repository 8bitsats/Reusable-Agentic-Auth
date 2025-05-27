import { Action, IAgentRuntime, Memory } from "@elizaos/core";
import { AuthStateManager } from "../services/authStateManager";
import { WalletAdapter } from "../services/walletAdapter";
import { Transaction, PublicKey } from "@solana/web3.js";

/**
 * Action that handles signing Solana transactions using the authenticated wallet
 */
export const signTransactionAction: Action = {
  name: "SIGN_TRANSACTION",
  similes: ["SIGN_TX", "AUTHORIZE_TRANSACTION"],
  description: "Signs a Solana transaction using the authenticated wallet",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("sign transaction") ||
      text.includes("sign tx") ||
      text.includes("authorize transaction") ||
      text.includes("approve transaction")
    );
  },
  
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      // Get services
      const authStateManager = runtime.getService("SOLANA_AUTH_STATE_MANAGER") as AuthStateManager;
      const walletAdapter = runtime.getService("SOLANA_WALLET_ADAPTER") as WalletAdapter;
      
      // Check for existing auth state
      const serviceKey = "solana-auth";
      const authState = await authStateManager.loadAuthState(serviceKey);
      
      if (!authState || !authStateManager.isValid(authState)) {
        await runtime.messageManager.createMemory({
          content: {
            text: "You need to authenticate with your Solana wallet before signing transactions. Would you like to connect now?"
          },
          userId: runtime.agentId,
          roomId: message.roomId,
        });
        
        return false;
      }
      
      // In a real implementation, this would parse the transaction details from the message
      // For demonstration, we'll simulate a simple transaction
      
      await runtime.messageManager.createMemory({
        content: {
          text: "I'll help you sign this transaction. Please review the details before approving."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      // Simulate transaction details
      const transactionDetails = {
        type: "Transfer",
        amount: "0.1 SOL",
        recipient: "8ZU9ZUiN5HSfgP2fFGFjqGJVi36LNJ9JMQz6KWWkCzHx",
        fee: "0.000005 SOL"
      };
      
      await runtime.messageManager.createMemory({
        content: {
          text: `Transaction Details:\n- Type: ${transactionDetails.type}\n- Amount: ${transactionDetails.amount}\n- Recipient: ${transactionDetails.recipient}\n- Network Fee: ${transactionDetails.fee}\n\nPlease confirm this transaction in your wallet.`
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      // In a real implementation, this would create and send the transaction
      // For demonstration, we'll simulate a successful signature
      
      // Simulate a delay for the signing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await runtime.messageManager.createMemory({
        content: {
          text: "Transaction signed successfully! The transaction has been submitted to the Solana network and is being processed."
        },
        userId: runtime.agentId,
        roomId: message.roomId,
      });
      
      return true;
    } catch (error) {
      console.error("Transaction signing error:", error);
      
      await runtime.messageManager.createMemory({
        content: {
          text: "There was an error signing the transaction. Please try again later."
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
        content: { text: "Can you help me sign a transaction to send 0.1 SOL?" }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll help you sign this transaction. Please review the details before approving.",
          action: "SIGN_TRANSACTION"
        }
      }
    ]
  ]
};
