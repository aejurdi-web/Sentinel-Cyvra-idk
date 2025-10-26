import crypto from 'crypto';
import configManager from './configManager';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface EncryptionPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encrypt(text: string): EncryptionPayload {
  const key = Buffer.from(configManager.getEncryptionKey(), 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decrypt(payload: EncryptionPayload): string {
  const key = Buffer.from(configManager.getEncryptionKey(), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'hex'), {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
