import nodeSchedule from 'node-schedule';
import { BrowserWindow } from 'electron';
import { v4 as uuid } from 'uuid';
import VaultDatabase, { StoredCredential } from '../utils/database';
import logger from '../utils/logger';
import { isCredentialCompromised } from '../services/breachMonitor';
import { EmailService, EmailConfig } from '../services/emailService';

export interface AutomationLogEntry {
  id: string;
  credentialId: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
}

export type AutomationEvent = 'automation:log' | 'automation:reset-complete';

export class PasswordResetEngine {
  private automationLogs: AutomationLogEntry[] = [];
  private scheduler = nodeSchedule;
  private window?: BrowserWindow;
  private emailService?: EmailService;
  private apiKey?: string;

  constructor(private db = VaultDatabase) {}

  bindWindow(window: BrowserWindow) {
    this.window = window;
  }

  setApiKey(key?: string) {
    this.apiKey = key;
  }

  configureEmail(config?: EmailConfig) {
    if (config) {
      this.emailService = new EmailService(config);
    }
  }

  startMonitoring() {
    this.scheduler.scheduleJob('*/15 * * * *', () => {
      this.checkCompromisedPasswords().catch(error => logger.error('Scheduled check failed', error));
    });
    this.log('automation engine started', 'info');
    this.checkCompromisedPasswords().catch(error => logger.error('Initial check failed', error));
  }

  async checkCompromisedPasswords() {
    const credentials = this.db.fetchCredentials();
    for (const credential of credentials) {
      if (await isCredentialCompromised(credential, this.apiKey)) {
        this.log(`Credential ${credential.name} marked as compromised.`, 'warn', credential.id);
        if (credential.autoReset) {
          await this.triggerResetFlow(credential);
        }
      }
    }
  }

  async triggerResetFlow(credential: StoredCredential) {
    try {
      this.log(`Starting reset flow for ${credential.name}`, 'info', credential.id);
      const verificationCode = this.emailService
        ? await this.emailService.fetchLatestVerificationCode(/(\\d{6})/)
        : null;
      // Simulated automation steps
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.db.upsertCredential({
        id: credential.id,
        name: credential.name,
        username: credential.username,
        password: '***temporary***',
        breachStatus: 'safe',
        lastResetAt: new Date().toISOString(),
        autoReset: credential.autoReset,
        notes: verificationCode ? `Verification code ${verificationCode.code}` : undefined,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      });
      this.emit('automation:reset-complete', credential.id);
      this.log(`Password reset flow complete for ${credential.name}`, 'info', credential.id);
    } catch (error) {
      logger.error('Reset flow failed', error);
      this.log(`Reset flow failed: ${String(error)}`, 'error', credential.id);
    }
  }

  getLogs() {
    return this.automationLogs.slice(-100);
  }

  private emit(event: AutomationEvent, payload: unknown) {
    this.window?.webContents.send(event, payload);
  }

  private log(message: string, level: 'info' | 'warn' | 'error', credentialId?: string) {
    const entry: AutomationLogEntry = {
      id: uuid(),
      credentialId: credentialId ?? 'system',
      message,
      timestamp: new Date().toISOString(),
      level
    };
    this.automationLogs.push(entry);
    this.emit('automation:log', entry);
    logger.log({ level, message });
  }
}

export default new PasswordResetEngine();
