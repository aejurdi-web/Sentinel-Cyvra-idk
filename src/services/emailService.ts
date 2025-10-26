import { ImapFlow } from 'imapflow';
import logger from '../utils/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface VerificationCode {
  code: string;
  receivedAt: Date;
  subject: string;
}

export class EmailService {
  private client?: ImapFlow;
  constructor(private config: EmailConfig) {}

  async connect() {
    try {
      this.client = new ImapFlow(this.config);
      await this.client.connect();
      logger.info('Connected to IMAP server.');
    } catch (error) {
      logger.error('Failed to connect to IMAP server', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.logout();
    }
  }

  async fetchLatestVerificationCode(pattern: RegExp): Promise<VerificationCode | null> {
    if (!this.client) {
      await this.connect();
    }
    const lock = await this.client!.getMailboxLock('INBOX');
    try {
      const message = await this.client!.fetchOne('*', { source: true, envelope: true }, { uid: true });
      if (!message || !message.source) {
        return null;
      }
      const body = message.source.toString();
      const match = body.match(pattern);
      if (!match) {
        return null;
      }
      return {
        code: match[1],
        receivedAt: new Date(message.envelope?.date ?? Date.now()),
        subject: message.envelope?.subject ?? 'Verification code'
      };
    } catch (error) {
      logger.error('Failed to fetch verification code', error);
      return null;
    } finally {
      lock.release();
    }
  }
}
