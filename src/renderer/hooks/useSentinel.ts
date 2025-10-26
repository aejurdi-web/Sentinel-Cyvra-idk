import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AutomationLogEntry } from '../../automation/passwordResetEngine';
import type { StoredCredential } from '../../utils/database';

export function useCredentials() {
  const [data, setData] = useState<StoredCredential[] | undefined>();
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const latestRequest = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = Date.now();
    latestRequest.current = requestId;
    setIsLoading(true);
    try {
      const credentials = await window.sentinel.listCredentials();
      if (latestRequest.current === requestId) {
        setData(credentials);
        setError(undefined);
      }
    } catch (err) {
      if (latestRequest.current === requestId) {
        setError(err);
      }
    } finally {
      if (latestRequest.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateState = useCallback((next: StoredCredential[] | undefined) => {
    setData(next);
    setIsLoading(false);
  }, []);

  const saveCredential = useCallback(async (credential: unknown) => {
    const next = await window.sentinel.saveCredential(credential);
    updateState(next);
    return next;
  }, [updateState]);

  const deleteCredential = useCallback(async (id: string) => {
    const next = await window.sentinel.deleteCredential(id);
    updateState(next);
    return next;
  }, [updateState]);

  const importVault = useCallback(async () => {
    const next = await window.sentinel.importVault();
    updateState(next);
    return next;
  }, [updateState]);

  const exportVault = useCallback(() => window.sentinel.exportVault(), []);

  return {
    data,
    error,
    isLoading,
    refetch,
    saveCredential,
    deleteCredential,
    importVault,
    exportVault
  };
}

export function useAutomationLogs() {
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    try {
      const next = await window.sentinel.getLogs();
      setLogs(next);
      setError(undefined);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
    const interval = window.setInterval(() => {
      void fetchLogs();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [fetchLogs]);

  return useMemo(() => ({
    data: logs,
    error,
    isLoading,
    refetch: fetchLogs
  }), [logs, error, isLoading, fetchLogs]);
}

export function useAutomationEvents(onLog: (entry: AutomationLogEntry) => void) {
  return useCallback(() => {
    const handler = (_event: unknown, payload: AutomationLogEntry) => onLog(payload);
    window.sentinel.onAutomationLog(handler);
    return () => {
      // no-op: electron handles removal when window reloads
    };
  }, [onLog]);
}
