import type { AutomationLogEntry } from '../automation/passwordResetEngine';
import type { StoredCredential } from '../utils/database';
import type { SentinelAPI } from '../preload/preload';

declare global {
  interface Window {
    sentinel: SentinelAPI & {
      listCredentials: () => Promise<StoredCredential[]>;
      saveCredential: (data: StoredCredential | Record<string, unknown>) => Promise<StoredCredential[]>;
      deleteCredential: (id: string) => Promise<StoredCredential[]>;
      importVault: () => Promise<StoredCredential[]>;
      exportVault: () => Promise<boolean>;
      triggerReset: (id: string) => Promise<void>;
      onResetComplete: (callback: (_event: unknown, id: string) => void) => void;
      onVaultLock: (callback: (_event: unknown) => void) => void;
      notifyActivity: () => void;
      getLogs: () => Promise<AutomationLogEntry[]>;
      onAutomationLog: (callback: (_event: unknown, payload: AutomationLogEntry) => void) => void;
    };
  }
}

export {};
