// vault.js — plaintext compatible + optional AES-256-GCM encryption
// NOTE: For learning/dev. Don't store the master password; keep it in memory only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PLAINTEXT_FILE = path.join(__dirname, 'vault.json');
const ENCRYPTED_FILE = path.join(__dirname, 'vault.secure.json');

let _masterPassword = null; // held in memory only while unlocked

// ---------- helpers ----------
function ensurePlainFile() {
  if (!fs.existsSync(PLAINTEXT_FILE)) {
    fs.writeFileSync(PLAINTEXT_FILE, JSON.stringify({ accounts: [] }, null, 2), 'utf8');
  }
}
function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}
function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function deriveKey(password, saltB64) {
  const salt = saltB64 ? Buffer.from(saltB64, 'base64') : crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32); // AES-256 key
  return { key, saltB64: salt.toString('base64') };
}

function encryptVaultObject(obj, password, saltB64) {
  const { key, saltB64: saltOut } = deriveKey(password, saltB64);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: 'aes-256-gcm',
    kdf: 'scrypt',
    salt: saltOut,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ct.toString('base64'),
  };
}

function decryptVaultObject(enc, password) {
  if (!enc || enc.v !== 1) throw new Error('Invalid vault format');
  const { key } = deriveKey(password, enc.salt);
  const iv = Buffer.from(enc.iv, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const ct = Buffer.from(enc.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString('utf8'));
}

function isEncrypted() {
  return exists(ENCRYPTED_FILE);
}

// ---------- plaintext mode (legacy) ----------
function loadPlain() {
  ensurePlainFile();
  return readJSON(PLAINTEXT_FILE);
}
function savePlain(v) {
  writeJSON(PLAINTEXT_FILE, v);
}

// ---------- encrypted mode ----------
function loadEncrypted() {
  if (!_masterPassword) throw new Error('LOCKED');
  const enc = readJSON(ENCRYPTED_FILE);
  return decryptVaultObject(enc, _masterPassword);
}
function saveEncrypted(vault) {
  if (!_masterPassword) throw new Error('LOCKED');
  // keep same salt if present to avoid KDF churn
  const current = exists(ENCRYPTED_FILE) ? readJSON(ENCRYPTED_FILE) : null;
  const salt = current?.salt;
  const enc = encryptVaultObject(vault, _masterPassword, salt);
  writeJSON(ENCRYPTED_FILE, enc);
}

// ---------- public API (mode-aware) ----------
function loadVault() {
  return isEncrypted() ? loadEncrypted() : loadPlain();
}
function saveVault(vault) {
  isEncrypted() ? saveEncrypted(vault) : savePlain(vault);
}

function listAccounts() {
  return loadVault().accounts;
}

function addAccount({ site, username, password }) {
  const vault = loadVault();
  const id = Date.now();
  vault.accounts.push({
    id,
    site,
    username,
    password,
    updatedAt: new Date().toISOString(),
  });
  saveVault(vault);
  return id;
}

function updatePassword(id, newPassword) {
  const vault = loadVault();
  const acct = vault.accounts.find(a => a.id === id);
  if (!acct) throw new Error('Account not found');
  acct.password = newPassword;
  acct.updatedAt = new Date().toISOString();
  saveVault(vault);
  return acct;
}

function removeAccount(id) {
  const vault = loadVault();
  const idx = vault.accounts.findIndex(a => a.id === id);
  if (idx >= 0) {
    vault.accounts.splice(idx, 1);
    saveVault(vault);
  }
}

// ---------- security controls ----------
function unlock(masterPassword) {
  if (!isEncrypted()) throw new Error('No encrypted vault to unlock');
  // Try to decrypt; throws if wrong
  decryptVaultObject(readJSON(ENCRYPTED_FILE), masterPassword);
  _masterPassword = masterPassword;
  return true;
}

function lock() {
  _masterPassword = null;
}

function setMasterPassword(masterPassword) {
  if (isEncrypted()) throw new Error('Vault already encrypted. Use changeMasterPassword().');

  // migrate existing plaintext data (or init empty)
  const data = exists(PLAINTEXT_FILE) ? loadPlain() : { accounts: [] };

  const enc = encryptVaultObject(data, masterPassword);
  writeJSON(ENCRYPTED_FILE, enc);

  // keep a one-time backup, then remove plaintext
  if (exists(PLAINTEXT_FILE)) {
    fs.renameSync(PLAINTEXT_FILE, PLAINTEXT_FILE + '.bak');
  }
  _masterPassword = masterPassword;
  return true;
}

function changeMasterPassword(oldPw, newPw) {
  if (!isEncrypted()) throw new Error('Vault is not encrypted.');
  // verify and decrypt with old
  const plain = decryptVaultObject(readJSON(ENCRYPTED_FILE), oldPw);
  const enc = encryptVaultObject(plain, newPw); // new salt
  writeJSON(ENCRYPTED_FILE, enc);
  _masterPassword = newPw;
  return true;
}

// Optional helper: reveal file paths in UI
const VAULT_FILES = { PLAINTEXT_FILE, ENCRYPTED_FILE };

module.exports = {
  // CRUD
  listAccounts,
  addAccount,
  updatePassword,
  removeAccount,
  // Security
  setMasterPassword,
  unlock,
  lock,
  changeMasterPassword,
  // Info
  VAULT_FILES,
  isEncrypted,
};
