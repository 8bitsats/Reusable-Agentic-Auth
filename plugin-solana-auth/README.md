# Solana Agent Authentication Plugin for Eliza OS

## Overview

This plugin provides a reusable authentication flow for Solana AI agents within the Eliza OS ecosystem. It manages wallet connections and authentication state, allowing agents to maintain persistent authentication across sessions without requiring users to repeatedly authenticate.

## Features

- **Persistent Authentication**: Store and reuse authentication state across sessions
- **Automatic Refresh**: Refresh expired authentication tokens when possible
- **Secure Storage**: Encrypt sensitive authentication data before storage
- **Multiple Storage Options**: Support for file, database, and memory storage backends
- **Network Flexibility**: Works with mainnet, devnet, testnet, and custom Solana networks
- **Action Handlers**: Built-in actions for authentication, status checks, and transaction signing

## Installation

```bash
npm install @elizaos/plugin-solana-auth
```

## Usage

### Integrate with Eliza OS

Add the plugin to your Eliza OS character configuration:

```json
{
  "name": "Your Agent Name",
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

### Using Authentication in Conversations

The plugin enables agents to handle authentication-related conversations naturally. Here are some example interactions:

**Connecting a Wallet:**
```
User: "Can you help me connect my Solana wallet?"
Agent: "I'll help you authenticate with your Solana wallet. Please connect your wallet when prompted."
[Wallet connection flow]
Agent: "Authentication successful! Your wallet is now connected and your session is securely saved for future use."
```

**Checking Authentication Status:**
```
User: "Can you check if I'm still connected?"
Agent: "You're currently authenticated with your Solana wallet (ABC123...XYZ). Your session is valid for another 23 hours and 45 minutes on the mainnet-beta network."
```

**Using Existing Authentication:**
```
User: "Send 0.1 SOL to address XYZ"
Agent: "I'll help you sign this transaction. Please review the transaction details when prompted by your wallet."
[Transaction signing flow]
Agent: "Transaction signed successfully! Transaction signature: 12345678..."
```

## Architecture

The plugin consists of three main components:

1. **Solana Auth Plugin**: The main plugin that registers services and actions with Eliza OS
2. **Auth State Manager**: A service that manages authentication state storage and retrieval
3. **Wallet Adapter**: A service that integrates with Solana wallet adapters

### Actions

- **AUTHENTICATE_SOLANA**: Handles wallet connection and authentication
- **CHECK_AUTH_STATE**: Checks current authentication status
- **SIGN_SOLANA_TRANSACTION**: Signs transactions using the authenticated wallet

## Security

The plugin implements several security measures:

- Authentication state is encrypted using AES-256-CBC
- Sessions have a configurable Time To Live (TTL)
- Nonce and timestamp are included in authentication messages
- Signatures are verified before authentication is granted

## Development

To build the plugin from source:

```bash
git clone [repository URL]
cd plugin-solana-auth
npm install
npm run build
```

## License

MIT
