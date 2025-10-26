import keytar from 'keytar';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const SERVICE_NAME = 'SentinelSecurityManager';
const ACCOUNT_NAME = 'encryptionKey';
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export class ConfigManager {
  private static instance: ConfigManager;
  private encryptionKey: string | null = null;

  private constructor() {
    this.bootstrapConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private bootstrapConfig() {
    try {
      const existingKey = process.env.SENTINEL_ENCRYPTION_KEY;
      if (existingKey) {
        this.encryptionKey = existingKey;
        logger.info('Loaded encryption key from environment variable.');
        return;
      }
      if (fs.existsSync(CONFIG_PATH)) {
        const stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        if (stored.encryptionKey) {
          this.encryptionKey = stored.encryptionKey;
        }
      }
      keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME).then(async key => {
        if (!key) {
          const newKey = crypto.randomBytes(32).toString('hex');
          await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, newKey);
          this.encryptionKey = newKey;
          logger.info('Generated new encryption key and stored securely.');
          fs.writeFileSync(CONFIG_PATH, JSON.stringify({ encryptionKey: newKey }, null, 2));
        } else {
          this.encryptionKey = key;
          logger.info('Loaded encryption key from secure storage.');
          fs.writeFileSync(CONFIG_PATH, JSON.stringify({ encryptionKey: key }, null, 2));
        }
      });
    } catch (error) {
      logger.error('Failed to bootstrap config', error);
      if (fs.existsSync(CONFIG_PATH)) {
        const stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        this.encryptionKey = stored.encryptionKey;
      } else {
        this.encryptionKey = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ encryptionKey: this.encryptionKey }, null, 2));
      }
    }
  }

  getEncryptionKey(): string {
    if (!this.encryptionKey) {
      if (fs.existsSync(CONFIG_PATH)) {
        const stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        if (stored.encryptionKey) {
          this.encryptionKey = stored.encryptionKey;
        }
      }
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized yet.');
      }
    }
    return this.encryptionKey;
  }
}

export default ConfigManager.getInstance();
