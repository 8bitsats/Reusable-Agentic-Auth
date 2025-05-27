import { ServiceType } from "@elizaos/core";

export interface AuthState {
  walletPublicKey: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
  refreshToken?: string;
  permissions: string[];
  network: string;
}

export const AUTH_STATE_MANAGER_SERVICE_TYPE = "SOLANA_AUTH_STATE_MANAGER" as ServiceType;
export const WALLET_ADAPTER_SERVICE_TYPE = "SOLANA_WALLET_ADAPTER" as ServiceType;
