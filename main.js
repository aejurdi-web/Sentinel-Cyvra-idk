// main.js
// Electron main process: creates the window and handles IPC.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// NEW: settings store (Step 3)
const settings = require('./settings');

// Set where the vault files should live in both dev + packaged builds
// (your vault.js uses process.env.VAULT_DIR || __dirname)
process.env.VAULT_DIR = app.getPath('userData');

const vault = require('./vault');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'Sentinel',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
  win.setTitle('Sentinel');

  // Optional: open DevTools during development
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------------------------------------
   IPC: Vault (CRUD + Security)
----------------------------------------*/
ipcMain.handle('vault:isEncrypted', () => vault.isEncrypted());
ipcMain.handle('vault:setMaster', (_e, pw) => vault.setMasterPassword(pw));
ipcMain.handle('vault:unlock', (_e, pw) => vault.unlock(pw));
ipcMain.handle('vault:lock', () => (vault.lock(), true));
ipcMain.handle('vault:paths', () => vault.VAULT_FILES);
ipcMain.handle('vault:changeMaster', (_e, oldPw, newPw) =>
  vault.changeMasterPassword(oldPw, newPw)
);

ipcMain.handle('vault:list', () => vault.listAccounts());
ipcMain.handle('vault:add', (_e, acct) => vault.addAccount(acct));
ipcMain.handle('vault:updatePass', (_e, id, p) => vault.updatePassword(id, p));
ipcMain.handle('vault:remove', (_e, id) => vault.removeAccount(id));

/* ---------------------------------------
   IPC: Export / Import (uses dialog)
----------------------------------------*/
ipcMain.handle('files:exportVault', async () => {
  const { PLAINTEXT_FILE, ENCRYPTED_FILE } = vault.VAULT_FILES;

  // Prefer encrypted file if it exists
  const src = fs.existsSync(ENCRYPTED_FILE) ? ENCRYPTED_FILE : PLAINTEXT_FILE;
  if (!fs.existsSync(src)) return false;

  const res = await dialog.showSaveDialog({
    title: 'Export Vault',
    defaultPath: path.basename(src),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (res.canceled || !res.filePath) return false;

  fs.copyFileSync(src, res.filePath);
  return true;
});

ipcMain.handle('files:importVault', async () => {
  const baseDir = process.env.VAULT_DIR || app.getPath('userData');

  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import Vault',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths || !filePaths[0]) return false;

  const src = filePaths[0];
  const name = path.basename(src).toLowerCase();

  // If the filename contains 'secure', assume encrypted vault format
  const dest = name.includes('secure')
    ? path.join(baseDir, 'vault.secure.json')
    : path.join(baseDir, 'vault.json');

  fs.copyFileSync(src, dest);
  return true;
});

/* ---------------------------------------
   IPC: Settings  (NEW in Step 3)
----------------------------------------*/
ipcMain.handle('settings:get', (_e, key) => settings.get(key));
ipcMain.handle('settings:set', (_e, key, value) => { settings.set(key, value); return true; });
ipcMain.handle('settings:all', () => settings.all());