import { AgentRuntime } from "@elizaos/core";
import { solanaAuthPlugin } from "../src";
import { AuthStateManager } from "../src/services/authStateManager";
import { WalletAdapter } from "../src/services/walletAdapter";
import { AUTH_STATE_MANAGER_SERVICE_TYPE, WALLET_ADAPTER_SERVICE_TYPE } from "../src/types";

/**
 * This example demonstrates how to programmatically use the Solana auth plugin
 * in an Eliza OS agent implementation.
 */
async function main(): Promise<void> {
  // Initialize agent runtime with the Solana auth plugin
  const runtime = new AgentRuntime({
    plugins: [solanaAuthPlugin],
    settings: {
      secrets: {
        ENCRYPTION_KEY: "example-secure-key-for-encryption",
      },
      "solana-auth": {
        authStateStorageType: "memory", // Use memory storage for this example
        authStateTTL: 3600, // 1 hour
        autoRefresh: true,
        SOLANA_NETWORK: "devnet",
      },
    },
  });

  // Initialize runtime
  await runtime.initialize();

  // Get the auth state manager service
  const authStateManager = runtime.getService(
    AUTH_STATE_MANAGER_SERVICE_TYPE
  ) as AuthStateManager;

  // Get the wallet adapter service
  const walletAdapter = runtime.getService(
    WALLET_ADAPTER_SERVICE_TYPE
  ) as WalletAdapter;

  // Check for existing authentication
  const serviceKey = "solana-auth";
  const existingAuth = await authStateManager.loadAuthState(serviceKey);

  if (existingAuth && authStateManager.isValid(existingAuth)) {
    console.log("User is already authenticated!");
    console.log(`Wallet: ${existingAuth.walletPublicKey}`);
    console.log(`Network: ${existingAuth.network}`);
    console.log(`Expires at: ${new Date(existingAuth.expiresAt).toLocaleString()}`);
  } else {
    console.log("User needs to authenticate. Starting wallet connection flow...");

    // Connect wallet
    const wallet = await walletAdapter.connectWallet();
    console.log(`Wallet connected: ${wallet.publicKey}`);

    // Generate authentication message
    const authMessage = await walletAdapter.generateAuthMessage(wallet.publicKey);
    console.log(`\nPlease sign this message:\n${authMessage}\n`);

    // Request signature (in a real implementation, this would be handled by the wallet UI)
    const signature = await walletAdapter.requestSignature(
      wallet.publicKey,
      authMessage
    );

    // Verify signature
    const isValid = await walletAdapter.verifySignature(
      wallet.publicKey,
      authMessage,
      signature
    );

    if (isValid) {
      // Save authentication state
      const authState = {
        walletPublicKey: wallet.publicKey,
        signature,
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600 * 1000, // 1 hour
        permissions: ["transfer", "sign"],
        network: "devnet",
      };

      await authStateManager.saveAuthState(serviceKey, authState);
      console.log("Authentication successful! Auth state saved.");
    } else {
      console.error("Signature verification failed!");
    }
  }

  // Clean up
  await runtime.shutdown();
}

// Run the example
main().catch(console.error);
