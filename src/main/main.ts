import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { autoUpdater } from 'electron-updater';
import logger from '../utils/logger';
import vaultDb from '../utils/database';
import idleLockManager from './idleLockManager';
import passwordResetEngine from '../automation/passwordResetEngine';
import configManager from '../utils/configManager';
import { biometricUnlock } from './biometric';
import { v4 as uuid } from 'uuid';

dotenv.config();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const rendererPath = path.join(__dirname, '../renderer/index.html');
  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5174';
  if (process.env.NODE_ENV === 'development') {
    mainWindow
      .loadURL(devServerUrl)
      .catch(error => logger.error('Failed to load dev server', error));
  } else {
    mainWindow
      .loadFile(rendererPath)
      .catch(error => logger.error('Failed to load renderer', error));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  idleLockManager.bindWindow(mainWindow);
  passwordResetEngine.bindWindow(mainWindow);
  passwordResetEngine.setApiKey(process.env.HIBP_API_KEY);
  if (process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS) {
    passwordResetEngine.configureEmail({
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT ?? 993),
      secure: process.env.IMAP_SECURE !== 'false',
      auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS
      }
    });
  }

  autoUpdater.checkForUpdatesAndNotify().catch(error => logger.error('Auto updater failed', error));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

autoUpdater.on('update-downloaded', info => {
  logger.info('Update downloaded: %s', info.version);
});

autoUpdater.on('error', error => {
  logger.error('Auto update error', error);
});

ipcMain.handle('vault:list', () => vaultDb.fetchCredentials());
ipcMain.handle('vault:save', (_event, payload) => {
  const sanitized = {
    id: payload.id ?? uuid(),
    name: payload.name,
    username: payload.username,
    password: typeof payload.password === 'string' ? payload.password : undefined,
    breachStatus: payload.breachStatus ?? 'safe',
    lastResetAt: payload.lastResetAt ?? null,
    autoReset: payload.autoReset ?? 0,
    notes: typeof payload.notes === 'string' ? payload.notes : undefined,
    createdAt: payload.createdAt
  };
  vaultDb.upsertCredential(sanitized);
  return vaultDb.fetchCredentials();
});
ipcMain.handle('vault:delete', (_event, id: string) => {
  vaultDb.deleteCredential(id);
  return vaultDb.fetchCredentials();
});

ipcMain.handle('vault:export', async () => {
  const data = vaultDb.exportVault();
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export vault',
    defaultPath: 'sentinel-vault.json',
    filters: [{ name: 'Encrypted Vault', extensions: ['json'] }]
  });
  if (filePath) {
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  }
  return false;
});

ipcMain.handle('vault:import', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Encrypted Vault', extensions: ['json'] }]
  });
  if (filePaths.length) {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    vaultDb.importVault(content);
    return vaultDb.fetchCredentials();
  }
  return vaultDb.fetchCredentials();
});

ipcMain.handle('vault:unlock', async () => {
  const result = await biometricUnlock();
  return result;
});

ipcMain.handle('vault:get-key', () => configManager.getEncryptionKey());

ipcMain.handle('automation:logs', () => passwordResetEngine.getLogs());

ipcMain.handle('automation:trigger', (_event, id: string) => {
  const credential = vaultDb.fetchCredentials().find(c => c.id === id);
  if (credential) {
    return passwordResetEngine.triggerResetFlow(credential);
  }
  return null;
});

ipcMain.handle('app:open-url', (_event, url: string) => shell.openExternal(url));

passwordResetEngine.startMonitoring();
