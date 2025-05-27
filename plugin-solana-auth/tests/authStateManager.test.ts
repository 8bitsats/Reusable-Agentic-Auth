import { AuthStateManager } from '../src/services/authStateManager';
import { IAgentRuntime } from '@elizaos/core';

// Mock dependencies
jest.mock('../src/utils/encryption', () => ({
  encryptData: jest.fn().mockImplementation((data) => Promise.resolve(`encrypted:${data}`)),
  decryptData: jest.fn().mockImplementation((data) => {
    const parts = data.split(':');
    return Promise.resolve(parts[1]);
  }),
}));

jest.mock('../src/utils/storage', () => ({
  storeData: jest.fn().mockResolvedValue(undefined),
  retrieveData: jest.fn().mockImplementation((key) => {
    if (key === 'valid-auth') {
      return Promise.resolve('encrypted:{"walletPublicKey":"test-key","signature":"test-sig","timestamp":1620000000000,"expiresAt":4076752800000,"permissions":["transfer"],"network":"devnet"}');
    } else if (key === 'expired-auth') {
      return Promise.resolve('encrypted:{"walletPublicKey":"test-key","signature":"test-sig","timestamp":1620000000000,"expiresAt":1620000001000,"refreshToken":"refresh-token","permissions":["transfer"],"network":"devnet"}');
    }
    return Promise.resolve(null);
  }),
}));

// Mock runtime
const mockRuntime: Partial<IAgentRuntime> = {
  getSetting: jest.fn().mockImplementation((key) => {
    if (key === 'ENCRYPTION_KEY') return 'test-key';
    if (key === 'authStateStorageType') return 'memory';
    if (key === 'autoRefresh') return true;
    return null;
  }),
};

describe('AuthStateManager', () => {
  let authStateManager: AuthStateManager;

  beforeEach(() => {
    authStateManager = new AuthStateManager();
    authStateManager.initialize(mockRuntime as IAgentRuntime);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadAuthState', () => {
    it('should return valid auth state from storage', async () => {
      const authState = await authStateManager.loadAuthState('valid-auth');
      expect(authState).toBeDefined();
      expect(authState?.walletPublicKey).toBe('test-key');
      expect(authState?.network).toBe('devnet');
    });

    it('should attempt to refresh expired auth state', async () => {
      // Mock refreshAuthState
      const refreshSpy = jest.spyOn(authStateManager, 'refreshAuthState').mockResolvedValueOnce({
        walletPublicKey: 'test-key',
        signature: 'test-sig',
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000,
        refreshToken: 'new-refresh-token',
        permissions: ['transfer'],
        network: 'devnet',
      });

      const authState = await authStateManager.loadAuthState('expired-auth');
      
      expect(refreshSpy).toHaveBeenCalled();
      expect(authState).toBeDefined();
      expect(authState?.refreshToken).toBe('new-refresh-token');
    });

    it('should return null for non-existent auth state', async () => {
      const authState = await authStateManager.loadAuthState('non-existent');
      expect(authState).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true for non-expired auth state', () => {
      const authState = {
        walletPublicKey: 'test-key',
        signature: 'test-sig',
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour in the future
        permissions: ['transfer'],
        network: 'devnet',
      };

      expect(authStateManager.isValid(authState)).toBe(true);
    });

    it('should return false for expired auth state', () => {
      const authState = {
        walletPublicKey: 'test-key',
        signature: 'test-sig',
        timestamp: Date.now() - 7200000, // 2 hours ago
        expiresAt: Date.now() - 3600000, // 1 hour ago
        permissions: ['transfer'],
        network: 'devnet',
      };

      expect(authStateManager.isValid(authState)).toBe(false);
    });
  });
});
