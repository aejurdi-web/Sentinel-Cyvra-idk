import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AutomationLogEntry } from '../../automation/passwordResetEngine';
import type { StoredCredential } from '../../utils/database';

export function useCredentials() {
  const queryClient = useQueryClient();
  const listQuery = useQuery<StoredCredential[]>({
    queryKey: ['credentials'],
    queryFn: () => window.sentinel.listCredentials()
  });

  const saveMutation = useMutation({
    mutationFn: (credential: unknown) => window.sentinel.saveCredential(credential),
    onSuccess: data => {
      queryClient.setQueryData(['credentials'], data);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => window.sentinel.deleteCredential(id),
    onSuccess: data => {
      queryClient.setQueryData(['credentials'], data);
    }
  });

  const importMutation = useMutation({
    mutationFn: () => window.sentinel.importVault(),
    onSuccess: data => {
      queryClient.setQueryData(['credentials'], data);
    }
  });

  return {
    listQuery,
    saveCredential: saveMutation.mutateAsync,
    deleteCredential: deleteMutation.mutateAsync,
    importVault: importMutation.mutateAsync,
    exportVault: () => window.sentinel.exportVault()
  };
}

export function useAutomationLogs() {
  return useQuery<AutomationLogEntry[]>({
    queryKey: ['automation-logs'],
    queryFn: () => window.sentinel.getLogs(),
    refetchInterval: 10000
  });
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
