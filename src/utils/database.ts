import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { encrypt, decrypt, EncryptionPayload } from './crypto';
import logger from './logger';

export interface StoredCredential {
  id: string;
  name: string;
  username: string;
  password: EncryptionPayload;
  createdAt: string;
  updatedAt: string;
  breachStatus: 'safe' | 'compromised';
  lastResetAt?: string | null;
  autoReset: number;
  notes?: EncryptionPayload | null;
}

export class VaultDatabase {
  private static instance: VaultDatabase;
  private db: Database.Database;

  private constructor() {
    const dbPath = path.join(process.cwd(), 'vault.db');
    const firstRun = !fs.existsSync(dbPath);
    this.db = new Database(dbPath);
    if (firstRun) {
      this.initialize();
    }
  }

  static getInstance(): VaultDatabase {
    if (!VaultDatabase.instance) {
      VaultDatabase.instance = new VaultDatabase();
    }
    return VaultDatabase.instance;
  }

  private initialize() {
    logger.info('Initializing database schema.');
    this.db
      .prepare(`
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          iv TEXT NOT NULL,
          authTag TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          breachStatus TEXT NOT NULL,
          lastResetAt TEXT,
          autoReset INTEGER DEFAULT 0,
          notes TEXT,
          notesIv TEXT,
          notesAuthTag TEXT
        );
      `)
      .run();
  }

  upsertCredential(data: Omit<StoredCredential, 'password' | 'notes'> & {
    password?: string;
    notes?: string | null;
  }) {
    const now = new Date().toISOString();
    let encryptedPassword = data.password ? encrypt(data.password) : null;
    const encryptedNotes = data.notes ? encrypt(data.notes) : null;
    if (!encryptedPassword) {
      const existing = this.db.prepare('SELECT password, iv, authTag FROM credentials WHERE id = ?').get(data.id);
      if (!existing) {
        throw new Error('Password required for new credential');
      }
      encryptedPassword = {
        ciphertext: existing.password,
        iv: existing.iv,
        authTag: existing.authTag
      };
    }
    this.db
      .prepare(`
        INSERT INTO credentials (id, name, username, password, iv, authTag, createdAt, updatedAt, breachStatus, lastResetAt, autoReset, notes, notesIv, notesAuthTag)
        VALUES (@id, @name, @username, @password, @iv, @authTag, @createdAt, @updatedAt, @breachStatus, @lastResetAt, @autoReset, @notes, @notesIv, @notesAuthTag)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          username = excluded.username,
          password = excluded.password,
          iv = excluded.iv,
          authTag = excluded.authTag,
          updatedAt = excluded.updatedAt,
          breachStatus = excluded.breachStatus,
          lastResetAt = excluded.lastResetAt,
          autoReset = excluded.autoReset,
          notes = excluded.notes,
          notesIv = excluded.notesIv,
          notesAuthTag = excluded.notesAuthTag;
      `)
      .run({
        ...data,
        password: encryptedPassword.ciphertext,
        iv: encryptedPassword.iv,
        authTag: encryptedPassword.authTag,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        notes: encryptedNotes?.ciphertext ?? null,
        notesIv: encryptedNotes?.iv ?? null,
        notesAuthTag: encryptedNotes?.authTag ?? null
      });
  }

  fetchCredentials(): StoredCredential[] {
    const rows = this.db.prepare('SELECT * FROM credentials').all();
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      username: row.username,
      password: {
        ciphertext: row.password,
        iv: row.iv,
        authTag: row.authTag
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      breachStatus: row.breachStatus,
      lastResetAt: row.lastResetAt,
      autoReset: row.autoReset,
      notes: row.notes
        ? {
            ciphertext: row.notes,
            iv: row.notesIv,
            authTag: row.notesAuthTag
          }
        : null
    }));
  }

  deleteCredential(id: string) {
    this.db.prepare('DELETE FROM credentials WHERE id = ?').run(id);
  }

  decryptPassword(payload: EncryptionPayload): string {
    return decrypt(payload);
  }

  exportVault(): string {
    const data = this.fetchCredentials();
    return JSON.stringify(data);
  }

  importVault(json: string) {
    const data: StoredCredential[] = JSON.parse(json);
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO credentials (id, name, username, password, iv, authTag, createdAt, updatedAt, breachStatus, lastResetAt, autoReset, notes, notesIv, notesAuthTag)
       VALUES (@id, @name, @username, @password, @iv, @authTag, @createdAt, @updatedAt, @breachStatus, @lastResetAt, @autoReset, @notes, @notesIv, @notesAuthTag)`
    );
    const insert = this.db.transaction((records: StoredCredential[]) => {
      for (const record of records) {
        stmt.run({
          id: record.id,
          name: record.name,
          username: record.username,
          password: record.password.ciphertext,
          iv: record.password.iv,
          authTag: record.password.authTag,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          breachStatus: record.breachStatus,
          lastResetAt: record.lastResetAt ?? null,
          autoReset: record.autoReset,
          notes: record.notes?.ciphertext ?? null,
          notesIv: record.notes?.iv ?? null,
          notesAuthTag: record.notes?.authTag ?? null
        });
      }
    });
    insert(data);
  }
}

export default VaultDatabase.getInstance();
