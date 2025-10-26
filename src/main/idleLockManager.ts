import { BrowserWindow, ipcMain, powerMonitor } from 'electron';

const IDLE_LIMIT = 5 * 60;

export class IdleLockManager {
  private timer?: NodeJS.Timeout;
  private window?: BrowserWindow;

  constructor(private idleSeconds = IDLE_LIMIT) {
    powerMonitor.on('lock-screen', () => this.lock());
    powerMonitor.on('suspend', () => this.lock());
  }

  bindWindow(window: BrowserWindow) {
    this.window = window;
    ipcMain.on('activity', () => this.reset());
    this.reset();
  }

  private reset() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.lock(), this.idleSeconds * 1000);
  }

  private lock() {
    this.window?.webContents.send('vault:lock');
  }
}

export default new IdleLockManager();
