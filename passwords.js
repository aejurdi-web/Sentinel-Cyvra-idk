// passwords.js
function generatePassword(opts = {}) {
  const length = opts.length ?? 20;
  const requireSymbols = opts.requireSymbols ?? true;

  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*_-+=?';
  const pool = letters + numbers + (requireSymbols ? symbols : '');

  const { randomFillSync } = require('crypto');
  const bytes = Buffer.alloc(length);
  randomFillSync(bytes);

  let out = '';
  for (let i = 0; i < length; i++) {
    out += pool[bytes[i] % pool.length];
  }
  return out;
}

module.exports = { generatePassword };