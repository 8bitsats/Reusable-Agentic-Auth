# Solana Agent Authentication Plugin: Quick Start Guide

## Overview

This quick start guide will help you integrate and use the Solana Authentication Plugin in your Eliza OS agent. The plugin provides a reusable authentication flow for Solana wallet integration, allowing your agent to maintain persistent wallet connections across sessions.

## Installation

1. Install the plugin package:

```bash
npm install @elizaos/plugin-solana-auth
```

2. Build the plugin from source (if needed):

```bash
cd plugin-solana-auth
npm install
npm run build
```

## Configuration

Add the plugin to your agent's configuration file:

```json
{
  "name": "Your Solana Agent",
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
      "SOLANA_NETWORK": "devnet"
    }
  }
}
```

## Key Features

- **Persistent Authentication**: Store authentication state securely between sessions
- **Auto-refresh**: Automatically refresh expired tokens when possible
- **Multiple Storage Options**: Choose between file, database, or memory storage
- **Network Support**: Works with mainnet, devnet, testnet, or custom RPC URLs

## Using the Plugin

The plugin provides three main actions:

1. **AUTHENTICATE_SOLANA**: Handles wallet connection and authentication
   - Triggered by: "connect wallet", "authenticate", "login", "sign in"

2. **CHECK_AUTH_STATE**: Checks current authentication status
   - Triggered by: "check auth", "auth status", "wallet status", "am i connected"

3. **SIGN_SOLANA_TRANSACTION**: Signs transactions with the authenticated wallet
   - Triggered by: "sign transaction", "send sol", "transfer tokens", "send tokens"

## Example User Interactions

```
User: "Can you help me connect my Solana wallet?"
Agent: "I'll help you authenticate with your Solana wallet. Please connect your wallet when prompted."
[Wallet connection flow]
Agent: "Authentication successful! Your wallet is now connected and your session is securely saved for future use."

User: "Am I connected to my wallet?"
Agent: "You're currently authenticated with your Solana wallet (ABC123...XYZ). Your session is valid for another 23 hours and 45 minutes on the devnet network."

User: "Send 0.1 SOL to address XYZ"
Agent: "I'll help you sign this transaction. Please review the transaction details when prompted by your wallet."
[Transaction signing flow]
Agent: "Transaction signed successfully! Transaction signature: 12345678..."
```

## Next Steps

1. Review the [full documentation](./README.md) for detailed information
2. Explore the [examples](./plugin-solana-auth/examples) directory for more usage patterns
3. Check out the [tests](./plugin-solana-auth/tests) to understand the behavior of the components

## Support

For more information, refer to:
- [Design Document](./solana-agent-auth-design.md) for architecture details
- [Validation Document](./solana-agent-auth-validation.md) for test scenarios and security considerations
