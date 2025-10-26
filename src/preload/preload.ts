import { contextBridge, ipcRenderer } from 'electron';

const api = {
  listCredentials: () => ipcRenderer.invoke('vault:list'),
  saveCredential: (data: unknown) => ipcRenderer.invoke('vault:save', data),
  deleteCredential: (id: string) => ipcRenderer.invoke('vault:delete', id),
  exportVault: () => ipcRenderer.invoke('vault:export'),
  importVault: () => ipcRenderer.invoke('vault:import'),
  unlock: () => ipcRenderer.invoke('vault:unlock'),
  getEncryptionKey: () => ipcRenderer.invoke('vault:get-key'),
  getLogs: () => ipcRenderer.invoke('automation:logs'),
  triggerReset: (id: string) => ipcRenderer.invoke('automation:trigger', id),
  openUrl: (url: string) => ipcRenderer.invoke('app:open-url', url),
  onAutomationLog: (callback: (event: unknown, payload: unknown) => void) =>
    ipcRenderer.on('automation:log', callback as never),
  onResetComplete: (callback: (event: unknown, payload: unknown) => void) =>
    ipcRenderer.on('automation:reset-complete', callback as never),
  onVaultLock: (callback: (event: unknown) => void) => ipcRenderer.on('vault:lock', callback as never),
  notifyActivity: () => ipcRenderer.send('activity')
};

contextBridge.exposeInMainWorld('sentinel', api);

export type SentinelAPI = typeof api;
