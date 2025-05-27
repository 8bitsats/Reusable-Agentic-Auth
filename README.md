# Reusable Agentic Auth

# Reusable Authentication Flow for Solana AI Agents

## Project Overview

This project provides a reusable authentication system for Solana blockchain integration with AI agents. It enables AI agents to maintain persistent wallet connections and authentication states across user sessions, minimizing the need for repeated wallet authentication while maintaining security.

## Key Features

- **Persistent Authentication**: Store and manage wallet authentication state across sessions
- **Secure Storage**: Encrypted storage of sensitive authentication data
- **Automatic Token Refresh**: Refresh expired tokens without user interaction when possible
- **Multiple Storage Options**: Support for file-based, database, or in-memory storage
- **Flexible Network Support**: Works with Solana mainnet, devnet, testnet, and custom RPC endpoints
- **Natural Conversation Flow**: Built-in action handlers to facilitate natural authentication conversations

## Project Structure

```
/
├── plugin-solana-auth/         # The main plugin implementation
│   ├── src/                    # Source code
│   │   ├── actions/            # Action handlers for user interactions
│   │   ├── services/           # Core services for auth state management
│   │   └── utils/              # Utility functions for encryption, storage, etc.
│   ├── package.json            # Plugin dependencies and scripts
│   └── README.md               # Plugin-specific documentation
├── solana-agent-auth-design.md # Detailed design specification
├── solana-agent-auth-validation.md # Validation scenarios and security considerations
└── README.md                  # This file - project overview
```

## Implementation Details

The solution is implemented as a plugin for Eliza OS, a framework for building AI agents. It consists of three main components:

1. **Solana Auth Plugin**: The main entry point that registers services and actions with Eliza OS.
2. **Auth State Manager**: A service that handles secure storage and retrieval of authentication state, with support for automatic refreshing of expired tokens.
3. **Wallet Adapter**: A service that integrates with Solana wallet adapters to handle wallet connections and signatures.

## Security Considerations

The implementation addresses several security concerns:

- **Data Encryption**: All sensitive data is encrypted using AES-256-CBC before storage
- **Secure Storage Options**: Multiple storage backends with appropriate security measures
- **Time-Limited Sessions**: Authentication states have configurable Time To Live (TTL) values
- **Signature Verification**: Uses Solana's cryptographic signature verification for authentication
- **Nonce and Timestamp**: Includes nonce and timestamp in authentication messages to prevent replay attacks

## Getting Started

To use this plugin in your Eliza OS agent:

1. Install the plugin package:
   ```bash
   npm install @elizaos/plugin-solana-auth
   ```

2. Add the plugin to your agent configuration:
   ```json
   {
     "name": "Your Agent",
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

3. Use the provided actions in your agent's conversations:
   - `AUTHENTICATE_SOLANA`: For connecting wallets and authenticating
   - `CHECK_AUTH_STATE`: For checking the current authentication status
   - `SIGN_SOLANA_TRANSACTION`: For signing transactions with the authenticated wallet

## Development

To build the plugin from source:

```bash
cd plugin-solana-auth
npm install
npm run build
```

## Documentation

For detailed information, please refer to:

- [Design Document](./solana-agent-auth-design.md): Architecture and implementation details
- [Validation Document](./solana-agent-auth-validation.md): Test scenarios and security considerations
- [Plugin README](./plugin-solana-auth/README.md): Plugin-specific documentation

## License

MIT
