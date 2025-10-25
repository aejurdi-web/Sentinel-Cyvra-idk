// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Vault API
contextBridge.exposeInMainWorld('vault', {
  isEncrypted: () => ipcRenderer.invoke('vault:isEncrypted'),
  setMaster:   (pw) => ipcRenderer.invoke('vault:setMaster', pw),
  unlock:      (pw) => ipcRenderer.invoke('vault:unlock', pw),
  lock:        () => ipcRenderer.invoke('vault:lock'),
  paths:       () => ipcRenderer.invoke('vault:paths'),
  changeMaster:(o,n) => ipcRenderer.invoke('vault:changeMaster', o, n),
  list:        () => ipcRenderer.invoke('vault:list'),
  add:         (a)  => ipcRenderer.invoke('vault:add', a),
  updatePass:  (id,p)=> ipcRenderer.invoke('vault:updatePass', id, p),
  remove:      (id) => ipcRenderer.invoke('vault:remove', id),
});

// File import/export
contextBridge.exposeInMainWorld('files', {
  exportVault: () => ipcRenderer.invoke('files:exportVault'),
  importVault: () => ipcRenderer.invoke('files:importVault'),
});

// NEW: Settings bridge
contextBridge.exposeInMainWorld('appSettings', {
  get:  (key)        => ipcRenderer.invoke('settings:get', key),
  set:  (key, value) => ipcRenderer.invoke('settings:set', key, value),
  all:  ()           => ipcRenderer.invoke('settings:all'),
});